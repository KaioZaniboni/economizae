import {useState, useCallback, useEffect} from 'react';
import {Item, ShoppingList} from '../types';
import {logDebug, logError, logPerformance} from '../utils/debug';

// Tag para identificar logs deste componente
const TAG = 'useShoppingList';

// Apenas um exemplo de implementação, na prática seria integrado com AsyncStorage e/ou Redux
export const useShoppingList = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar listas de compras do armazenamento local
  useEffect(() => {
    const loadLists = async () => {
      try {
        setLoading(true);
        // Simular um pequeno atraso para garantir que a UI tenha tempo de renderizar o estado de loading
        await new Promise(resolve => setTimeout(resolve, 300));

        // Aqui seria feita a leitura do AsyncStorage ou chamada API
        logDebug(TAG, 'Carregando listas de compras...');

        // Inicializa com um array vazio, sem listas pré-definidas
        const mockLists: ShoppingList[] = [];

        setLists(mockLists);
        setError(null);
        logDebug(TAG, `${mockLists.length} listas carregadas com sucesso`);
      } catch (err) {
        setError('Erro ao carregar listas');
        logError(TAG, err);
      } finally {
        setLoading(false);
      }
    };

    loadLists();
  }, []);

  // Criar uma nova lista
  const createList = useCallback(
    async (name: string, budget?: number): Promise<ShoppingList> => {
      return logPerformance(`${TAG}_createList`, async () => {
        try {
          logDebug(
            TAG,
            `Criando nova lista: ${name}${
              budget ? ` com orçamento: R$ ${budget.toFixed(2)}` : ''
            }`,
          );
          const newList: ShoppingList = {
            id: Date.now().toString(),
            name,
            items: [],
            total: 0,
            budget,
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setLists(prev => [...prev, newList]);
          // Aqui seria feita a persistência com AsyncStorage ou API
          return newList;
        } catch (err) {
          setError('Erro ao criar lista');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [],
  );

  // Adicionar item a uma lista
  const addItem = useCallback(
    async (
      listId: string,
      item: Omit<Item, 'id' | 'checked' | 'createdAt' | 'updatedAt'>,
    ): Promise<Item> => {
      return logPerformance(`${TAG}_addItem`, async () => {
        try {
          logDebug(
            TAG,
            `Adicionando item à lista ${listId}: ${JSON.stringify(item)}`,
          );
          const newItem: Item = {
            id: Date.now().toString(),
            ...item,
            checked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setLists(prev =>
            prev.map(list => {
              if (list.id === listId) {
                const updatedItems = [...list.items, newItem];
                const total = calculateTotal(updatedItems);
                return {
                  ...list,
                  items: updatedItems,
                  total,
                  updatedAt: Date.now(),
                };
              }
              return list;
            }),
          );

          return newItem;
        } catch (err) {
          setError('Erro ao adicionar item');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [],
  );

  // Atualizar item na lista
  const updateItem = useCallback(
    async (
      listId: string,
      itemId: string,
      updates: Partial<Item>,
    ): Promise<Item> => {
      return logPerformance(`${TAG}_updateItem`, async () => {
        try {
          logDebug(
            TAG,
            `Atualizando item ${itemId} na lista ${listId}: ${JSON.stringify(
              updates,
            )}`,
          );
          let updatedItem: Item | null = null;

          setLists(prev =>
            prev.map(list => {
              if (list.id === listId) {
                const updatedItems = list.items.map(item => {
                  if (item.id === itemId) {
                    updatedItem = {
                      ...item,
                      ...updates,
                      updatedAt: Date.now(),
                    };
                    return updatedItem;
                  }
                  return item;
                });

                const total = calculateTotal(updatedItems);

                return {
                  ...list,
                  items: updatedItems,
                  total,
                  updatedAt: Date.now(),
                };
              }
              return list;
            }),
          );

          if (!updatedItem) {
            throw new Error('Item não encontrado');
          }

          return updatedItem;
        } catch (err) {
          setError('Erro ao atualizar item');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [],
  );

  // Remover item da lista
  const removeItem = useCallback(
    async (listId: string, itemId: string): Promise<void> => {
      return logPerformance(`${TAG}_removeItem`, async () => {
        try {
          logDebug(TAG, `Removendo item ${itemId} da lista ${listId}`);
          setLists(prev =>
            prev.map(list => {
              if (list.id === listId) {
                const updatedItems = list.items.filter(
                  item => item.id !== itemId,
                );
                const total = calculateTotal(updatedItems);

                return {
                  ...list,
                  items: updatedItems,
                  total,
                  updatedAt: Date.now(),
                };
              }
              return list;
            }),
          );
        } catch (err) {
          setError('Erro ao remover item');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [],
  );

  // Atualizar lista completa
  const updateList = useCallback(
    async (
      listId: string,
      updates: Partial<ShoppingList>,
    ): Promise<ShoppingList> => {
      return logPerformance(`${TAG}_updateList`, async () => {
        try {
          logDebug(
            TAG,
            `Atualizando lista ${listId}: ${JSON.stringify(updates)}`,
          );

          let updatedList: ShoppingList | null = null;

          setLists(prev => {
            const newLists = prev.map(list => {
              if (list.id === listId) {
                updatedList = {
                  ...list,
                  ...updates,
                  updatedAt: Date.now(),
                };
                return updatedList;
              }
              return list;
            });

            if (!updatedList) {
              throw new Error('Lista não encontrada');
            }

            return newLists;
          });

          if (!updatedList) {
            throw new Error('Lista não encontrada');
          }

          return updatedList;
        } catch (err) {
          setError('Erro ao atualizar lista');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [],
  );

  // Excluir lista
  const deleteList = useCallback(async (listId: string): Promise<void> => {
    return logPerformance(`${TAG}_deleteList`, async () => {
      try {
        logDebug(TAG, `Excluindo lista ${listId}`);

        setLists(prev => {
          const filteredLists = prev.filter(list => list.id !== listId);

          if (filteredLists.length === prev.length) {
            throw new Error('Lista não encontrada');
          }

          return filteredLists;
        });
      } catch (err) {
        setError('Erro ao excluir lista');
        logError(TAG, err);
        throw err;
      }
    });
  }, []);

  // Função para calcular o total da lista
  const calculateTotal = (items: Item[]): number => {
    return items.reduce((sum, item) => {
      return sum + (item.price || 0) * item.quantity;
    }, 0);
  };

  return {
    lists,
    loading,
    error,
    createList,
    addItem,
    updateItem,
    removeItem,
    updateList,
    deleteList,
  };
};
