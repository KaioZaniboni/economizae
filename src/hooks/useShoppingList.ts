import {useState, useCallback, useEffect} from 'react';
import {Item, ShoppingList} from '../types';
import {logDebug, logError, logPerformance} from '../utils/debug';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tag para identificar logs deste componente
const TAG = 'useShoppingList';
const STORAGE_KEY = 'economizae_shopping_lists';

// Função auxiliar para salvar listas no AsyncStorage
const saveLists = async (listsToSave: ShoppingList[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listsToSave));
    logDebug(
      TAG,
      `${listsToSave.length} listas salvas com sucesso no AsyncStorage`,
    );
  } catch (err) {
    logError(TAG, `Erro ao salvar listas no AsyncStorage: ${err}`);
  }
};

// Função para calcular o total da lista
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => {
    // Garantir que o preço e a quantidade sejam valores numéricos válidos
    if (item.price !== undefined) {
      const itemPrice = parseFloat(String(item.price));
      const itemQuantity = parseInt(String(item.quantity)) || 1;

      if (!isNaN(itemPrice) && !isNaN(itemQuantity)) {
        return sum + itemPrice * itemQuantity;
      }
    }
    return sum;
  }, 0);
};

// Implementação com AsyncStorage para persistência
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

        // Carregar listas do AsyncStorage
        logDebug(TAG, 'Carregando listas de compras do AsyncStorage...');
        const storedLists = await AsyncStorage.getItem(STORAGE_KEY);

        let parsedLists: ShoppingList[] = [];
        if (storedLists) {
          parsedLists = JSON.parse(storedLists);
          logDebug(
            TAG,
            `${parsedLists.length} listas carregadas do AsyncStorage`,
          );

          // Verificar e recalcular o total de cada lista para garantir consistência
          let needsUpdate = false;
          parsedLists = parsedLists.map(list => {
            // Calcular o total real com base nos itens
            const calculatedTotal = calculateTotal(list.items);

            // Se o total armazenado for diferente do calculado, atualizar
            if (list.total !== calculatedTotal) {
              needsUpdate = true;
              return {
                ...list,
                total: calculatedTotal,
              };
            }
            return list;
          });

          // Se houve mudanças, persistir as listas atualizadas
          if (needsUpdate) {
            logDebug(TAG, 'Atualizando totais de listas inconsistentes');
            await saveLists(parsedLists);
          }
        } else {
          logDebug(TAG, 'Nenhuma lista encontrada no AsyncStorage');
        }

        setLists(parsedLists);
        setError(null);
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

          const updatedLists = [...lists, newList];
          setLists(updatedLists);

          // Persistir no AsyncStorage
          await saveLists(updatedLists);

          return newList;
        } catch (err) {
          setError('Erro ao criar lista');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [lists],
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

          const updatedLists = lists.map(list => {
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
          });

          setLists(updatedLists);

          // Persistir no AsyncStorage
          await saveLists(updatedLists);

          return newItem;
        } catch (err) {
          setError('Erro ao adicionar item');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [lists],
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

          const updatedLists = lists.map(list => {
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
          });

          setLists(updatedLists);

          // Persistir no AsyncStorage
          await saveLists(updatedLists);

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
    [lists],
  );

  // Remover item da lista
  const removeItem = useCallback(
    async (listId: string, itemId: string): Promise<void> => {
      return logPerformance(`${TAG}_removeItem`, async () => {
        try {
          logDebug(TAG, `Removendo item ${itemId} da lista ${listId}`);

          const updatedLists = lists.map(list => {
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
          });

          setLists(updatedLists);

          // Persistir no AsyncStorage
          await saveLists(updatedLists);
        } catch (err) {
          setError('Erro ao remover item');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [lists],
  );

  // Atualizar lista
  const updateList = useCallback(
    async (
      listId: string,
      updates: Partial<Omit<ShoppingList, 'id' | 'items'>>,
    ): Promise<ShoppingList> => {
      return logPerformance(`${TAG}_updateList`, async () => {
        try {
          logDebug(
            TAG,
            `Atualizando lista ${listId}: ${JSON.stringify(updates)}`,
          );
          let updatedList: ShoppingList | null = null;

          const updatedLists = lists.map(list => {
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

          setLists(updatedLists);

          // Persistir no AsyncStorage
          await saveLists(updatedLists);

          return updatedList;
        } catch (err) {
          setError('Erro ao atualizar lista');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [lists],
  );

  // Excluir lista
  const deleteList = useCallback(
    async (listId: string): Promise<void> => {
      return logPerformance(`${TAG}_deleteList`, async () => {
        try {
          logDebug(TAG, `Excluindo lista ${listId}`);

          const updatedLists = lists.filter(list => list.id !== listId);
          setLists(updatedLists);

          // Persistir no AsyncStorage
          await saveLists(updatedLists);
        } catch (err) {
          setError('Erro ao excluir lista');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [lists],
  );

  // Obter uma lista específica por ID
  const getListById = useCallback(
    async (listId: string): Promise<ShoppingList | null> => {
      return logPerformance(`${TAG}_getListById`, async () => {
        try {
          logDebug(TAG, `Buscando lista com ID: ${listId}`);

          // Tentar encontrar a lista na memória primeiro
          let list = lists.find(l => l.id === listId);

          // Se não encontrar na memória, tentar carregar do AsyncStorage diretamente
          if (!list) {
            logDebug(
              TAG,
              'Lista não encontrada na memória, verificando no AsyncStorage',
            );
            const storedLists = await AsyncStorage.getItem(STORAGE_KEY);

            if (storedLists) {
              const parsedLists: ShoppingList[] = JSON.parse(storedLists);
              list = parsedLists.find(l => l.id === listId);

              // Se encontrou no AsyncStorage mas não estava na memória, atualizar o estado
              if (list) {
                logDebug(
                  TAG,
                  'Lista encontrada no AsyncStorage, atualizando estado',
                );
                setLists(parsedLists);
              }
            }
          }

          if (!list) {
            logDebug(TAG, `Lista com ID ${listId} não encontrada`);
            return null;
          }

          // Recalcular o total da lista para garantir que esteja correto
          if (list.items && list.items.length > 0) {
            const calculatedTotal = calculateTotal(list.items);

            // Se o total calculado for diferente do armazenado, atualizar
            if (calculatedTotal !== list.total) {
              list = {
                ...list,
                total: calculatedTotal,
              };

              // Atualizar a lista no estado e persistência
              const updatedLists = lists.map(l =>
                l.id === list!.id ? list! : l,
              );

              setLists(updatedLists);
              await saveLists(updatedLists);
            }
          }

          return list;
        } catch (err) {
          setError('Erro ao buscar lista');
          logError(TAG, err);
          throw err;
        }
      });
    },
    [lists],
  );

  // Remover item da lista (alias para compatibilidade)
  const deleteItem = useCallback(
    async (listId: string, itemId: string): Promise<void> => {
      return removeItem(listId, itemId);
    },
    [removeItem],
  );

  // Recarregar listas do AsyncStorage
  const refreshLists = useCallback(async (): Promise<void> => {
    return logPerformance(`${TAG}_refreshLists`, async () => {
      try {
        setLoading(true);

        // Carregar listas do AsyncStorage
        logDebug(TAG, 'Recarregando listas de compras do AsyncStorage...');
        const storedLists = await AsyncStorage.getItem(STORAGE_KEY);

        let parsedLists: ShoppingList[] = [];
        if (storedLists) {
          parsedLists = JSON.parse(storedLists);
          logDebug(
            TAG,
            `${parsedLists.length} listas recarregadas do AsyncStorage`,
          );

          // Verificar e recalcular o total de cada lista para garantir consistência
          let needsUpdate = false;
          parsedLists = parsedLists.map(list => {
            // Calcular o total real com base nos itens
            const calculatedTotal = calculateTotal(list.items);

            // Se o total armazenado for diferente do calculado, atualizar
            if (list.total !== calculatedTotal) {
              needsUpdate = true;
              return {
                ...list,
                total: calculatedTotal,
              };
            }
            return list;
          });

          // Se houve mudanças, persistir as listas atualizadas
          if (needsUpdate) {
            logDebug(TAG, 'Atualizando totais de listas inconsistentes');
            await saveLists(parsedLists);
          }
        } else {
          logDebug(TAG, 'Nenhuma lista encontrada no AsyncStorage');
        }

        setLists(parsedLists);
        setError(null);
      } catch (err) {
        setError('Erro ao recarregar listas');
        logError(TAG, err);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return {
    lists,
    loading,
    error,
    createList,
    updateList,
    deleteList,
    addItem,
    updateItem,
    removeItem,
    getListById,
    deleteItem,
    refreshLists,
  };
};
