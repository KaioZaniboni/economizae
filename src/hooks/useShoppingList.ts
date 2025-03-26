import {useState, useCallback, useEffect} from 'react';
import {Item, ShoppingList} from '../types';
import {logDebug, logError, logPerformance} from '../utils/debug';
import {StorageUtil, STORAGE_KEYS} from '../utils/storage';
import {withRetry, validateData, NotFoundError} from '../utils/errorHandler';
import {
  useErrorNotification,
  useSuccessNotification,
} from '../contexts/NotificationContext';
import {clearCollapsedSectionsData} from '../utils/storage';

// Tag para identificar logs deste componente
const TAG = 'useShoppingList';

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

// Função auxiliar para salvar listas no storage
const saveLists = async (listsToSave: ShoppingList[]): Promise<void> => {
  try {
    // Validar a estrutura de dados antes de salvar
    listsToSave.forEach(list => {
      if (!list.items) {
        list.items = [];
      }

      // Garantir que todos os itens tenham um ID válido
      list.items = list.items.filter(item => item && item.id);

      // Recalcular o total para garantir consistência
      list.total = calculateTotal(list.items);
    });

    await StorageUtil.setItem(STORAGE_KEYS.SHOPPING_LISTS, listsToSave);
    logDebug(TAG, `${listsToSave.length} listas salvas com sucesso no storage`);
  } catch (err) {
    logError(TAG, `Erro ao salvar listas no storage: ${err}`);
    throw err;
  }
};

// Implementação com StorageUtil para persistência robusta
export const useShoppingList = () => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showErrorNotification = useErrorNotification();
  const showSuccessNotification = useSuccessNotification();

  // Carregar listas de compras do armazenamento local
  useEffect(() => {
    const loadLists = async () => {
      try {
        setLoading(true);
        // Simular um pequeno atraso para garantir que a UI tenha tempo de renderizar o estado de loading
        await new Promise(resolve => setTimeout(resolve, 300));

        // Carregar listas do storage
        logDebug(TAG, 'Carregando listas de compras do storage...');
        const storedLists = await StorageUtil.getItem<ShoppingList[]>(
          STORAGE_KEYS.SHOPPING_LISTS,
          [],
        );

        // Validação adicional dos dados recuperados
        let validatedLists: ShoppingList[] = [];
        let needsUpdate = false;

        if (Array.isArray(storedLists)) {
          validatedLists = storedLists.filter(
            list => validateData(list, ['id', 'name']), // Verifica os campos obrigatórios
          );

          // Verificar se houve filtragem de dados inválidos
          if (validatedLists.length !== storedLists.length) {
            needsUpdate = true;
            logDebug(
              TAG,
              `${
                storedLists.length - validatedLists.length
              } listas inválidas foram removidas`,
            );
          }

          // Verificar e recalcular o total de cada lista para garantir consistência
          validatedLists = validatedLists.map(list => {
            // Garantir que o array de itens existe
            if (!list.items) {
              list.items = [];
              needsUpdate = true;
            }

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
            logDebug(TAG, 'Atualizando listas inconsistentes ou inválidas');
            await saveLists(validatedLists);
          }

          logDebug(
            TAG,
            `${validatedLists.length} listas válidas carregadas do storage`,
          );
        } else {
          logDebug(TAG, 'Nenhuma lista válida encontrada no storage');
        }

        setLists(validatedLists);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar listas');
        logError(TAG, `${err}`);

        // Tentar recuperar um backup em caso de falha
        try {
          const backup = await StorageUtil.getItem<ShoppingList[]>(
            `${STORAGE_KEYS.SHOPPING_LISTS}_backup`,
            [],
          );
          if (Array.isArray(backup) && backup.length > 0) {
            logDebug(
              TAG,
              `Recuperando ${backup.length} listas do backup após falha`,
            );
            setLists(backup);
          }
        } catch (backupErr) {
          logError(TAG, `Também falhou ao recuperar backup: ${backupErr}`);
        }
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

          if (!name.trim()) {
            throw new Error('Nome da lista não pode ser vazio');
          }

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

          // Persistir no storage
          await saveLists(updatedLists);

          showSuccessNotification(`Lista "${name}" criada com sucesso`);
          return newList;
        } catch (err) {
          setError('Erro ao criar lista');
          logError(TAG, `${err}`);
          showErrorNotification(
            `Erro ao criar lista: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          throw err;
        }
      });
    },
    [lists, showErrorNotification, showSuccessNotification],
  );

  // Adicionar item a uma lista
  const addItem = useCallback(
    async (
      listId: string,
      item: Omit<Item, 'id' | 'checked' | 'createdAt' | 'updatedAt'>,
    ): Promise<Item> => {
      return logPerformance(`${TAG}_addItem`, async () => {
        try {
          if (!listId) {
            throw new Error('ID da lista é obrigatório');
          }
          if (!item.name.trim()) {
            throw new Error('Nome do item é obrigatório');
          }

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

          // Verificar se a lista existe
          const targetList = lists.find(l => l.id === listId);
          if (!targetList) {
            throw new NotFoundError(`Lista com ID ${listId} não encontrada`);
          }

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

          // Persistir no storage
          await saveLists(updatedLists);

          showSuccessNotification(`Item "${item.name}" adicionado com sucesso`);
          return newItem;
        } catch (err) {
          setError('Erro ao adicionar item');
          logError(TAG, `${err}`);
          showErrorNotification(
            `Erro ao adicionar item: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          throw err;
        }
      });
    },
    [lists, showErrorNotification, showSuccessNotification],
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
          if (!listId) {
            throw new Error('ID da lista é obrigatório');
          }
          if (!itemId) {
            throw new Error('ID do item é obrigatório');
          }

          logDebug(
            TAG,
            `Atualizando item ${itemId} na lista ${listId}: ${JSON.stringify(
              updates,
            )}`,
          );

          let updatedItem: Item | null = null;
          let listFound = false;

          const updatedLists = lists.map(list => {
            if (list.id === listId) {
              listFound = true;
              let itemFound = false;

              const updatedItems = list.items.map(item => {
                if (item.id === itemId) {
                  itemFound = true;
                  updatedItem = {
                    ...item,
                    ...updates,
                    updatedAt: Date.now(),
                  };
                  return updatedItem;
                }
                return item;
              });

              if (!itemFound) {
                throw new NotFoundError(
                  `Item ${itemId} não encontrado na lista ${listId}`,
                );
              }

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

          if (!listFound) {
            throw new NotFoundError(`Lista ${listId} não encontrada`);
          }

          setLists(updatedLists);

          // Persistir no storage
          await saveLists(updatedLists);

          if (!updatedItem) {
            throw new NotFoundError('Item não encontrado');
          }

          // Não mostrar notificação para checkbox
          if (updates.checked === undefined) {
            showSuccessNotification('Item atualizado com sucesso');
          }

          return updatedItem;
        } catch (err) {
          setError('Erro ao atualizar item');
          logError(TAG, `${err}`);
          showErrorNotification(
            `Erro ao atualizar item: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          throw err;
        }
      });
    },
    [lists, showErrorNotification, showSuccessNotification],
  );

  // Remover item da lista
  const removeItem = useCallback(
    async (listId: string, itemId: string): Promise<void> => {
      return logPerformance(`${TAG}_removeItem`, async () => {
        try {
          if (!listId) {
            throw new Error('ID da lista é obrigatório');
          }
          if (!itemId) {
            throw new Error('ID do item é obrigatório');
          }

          logDebug(TAG, `Removendo item ${itemId} da lista ${listId}`);

          // Encontrar o nome do item antes de removê-lo para mostrar na notificação
          let itemName = 'Item';
          const currentList = lists.find(list => list.id === listId);
          if (currentList) {
            const item = currentList.items.find(item => item.id === itemId);
            if (item) {
              itemName = item.name;
            }
          }

          let listFound = false;
          const updatedLists = lists.map(list => {
            if (list.id === listId) {
              listFound = true;
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

          if (!listFound) {
            throw new NotFoundError(`Lista ${listId} não encontrada`);
          }

          setLists(updatedLists);

          // Persistir no storage
          await saveLists(updatedLists);

          showSuccessNotification(`"${itemName}" removido com sucesso`);
        } catch (err) {
          setError('Erro ao remover item');
          logError(TAG, `${err}`);
          showErrorNotification(
            `Erro ao remover item: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          throw err;
        }
      });
    },
    [lists, showErrorNotification, showSuccessNotification],
  );

  // Atualizar lista
  const updateList = useCallback(
    async (
      listId: string,
      updates: Partial<Omit<ShoppingList, 'id' | 'items'>>,
    ): Promise<ShoppingList> => {
      return logPerformance(`${TAG}_updateList`, async () => {
        try {
          if (!listId) {
            throw new Error('ID da lista é obrigatório');
          }

          logDebug(
            TAG,
            `Atualizando lista ${listId}: ${JSON.stringify(updates)}`,
          );

          let updatedList: ShoppingList | null = null;
          let listFound = false;

          const updatedLists = lists.map(list => {
            if (list.id === listId) {
              listFound = true;
              updatedList = {
                ...list,
                ...updates,
                updatedAt: Date.now(),
              };
              return updatedList;
            }
            return list;
          });

          if (!listFound) {
            throw new NotFoundError(`Lista ${listId} não encontrada`);
          }

          if (!updatedList) {
            throw new NotFoundError('Lista não encontrada');
          }

          setLists(updatedLists);

          // Persistir no storage
          await saveLists(updatedLists);

          // Mostrar notificação apenas para mudanças significativas, não para atualizações de total automáticas
          if (
            updates.name !== undefined ||
            updates.budget !== undefined ||
            updates.completed !== undefined
          ) {
            showSuccessNotification(
              `Lista "${updatedList.name}" atualizada com sucesso`,
            );
          }

          return updatedList;
        } catch (err) {
          setError('Erro ao atualizar lista');
          logError(TAG, `${err}`);
          showErrorNotification(
            `Erro ao atualizar lista: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          throw err;
        }
      });
    },
    [lists, showErrorNotification, showSuccessNotification],
  );

  // Excluir uma lista
  const deleteList = useCallback(
    async (listId: string): Promise<boolean> => {
      try {
        logDebug(TAG, `Excluindo lista: ${listId}`);

        const updatedLists = lists.filter(list => list.id !== listId);

        // Atualizar estado local
        setLists(updatedLists);

        // Persistir no storage
        await saveLists(updatedLists);

        // Limpar dados persistidos das categorias desta lista
        await clearCollapsedSectionsData(listId);

        logDebug(TAG, `Lista ${listId} excluída com sucesso`);
        showSuccessNotification('Lista excluída com sucesso');

        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logError(TAG, `Erro ao excluir lista: ${errorMessage}`);
        showErrorNotification(`Erro ao excluir lista: ${errorMessage}`);
        throw error;
      }
    },
    [lists, showErrorNotification, showSuccessNotification],
  );

  // Obter uma lista específica por ID
  const getListById = useCallback(
    async (listId: string): Promise<ShoppingList | null> => {
      return logPerformance(`${TAG}_getListById`, async () => {
        if (!listId) {
          logError(TAG, 'ID da lista não fornecido ou inválido');
          return null;
        }

        return withRetry(
          async () => {
            try {
              logDebug(TAG, `Buscando lista com ID: ${listId}`);

              // Tentar encontrar a lista na memória primeiro
              let list = lists.find(l => l.id === listId);

              // Se não encontrar na memória, tentar carregar do storage diretamente
              if (!list) {
                logDebug(
                  TAG,
                  `Lista com ID ${listId} não encontrada na memória, verificando no storage`,
                );

                try {
                  const storedLists = await StorageUtil.getItem<ShoppingList[]>(
                    STORAGE_KEYS.SHOPPING_LISTS,
                    [],
                  );

                  // Validar dados carregados do storage
                  if (Array.isArray(storedLists)) {
                    list = storedLists.find(l => l.id === listId);

                    // Se encontrou no storage mas não estava na memória, atualizar o estado
                    if (list) {
                      logDebug(
                        TAG,
                        `Lista com ID ${listId} encontrada no storage, atualizando estado`,
                      );
                      setLists(storedLists);
                    } else {
                      logDebug(
                        TAG,
                        `Lista com ID ${listId} não encontrada no storage`,
                      );
                    }
                  } else {
                    logDebug(TAG, 'Nenhuma lista válida encontrada no storage');
                  }
                } catch (storageError) {
                  logError(TAG, `Erro ao acessar storage: ${storageError}`);
                  // Não retornar erro, continuar tentando usar as listas em memória
                }
              }

              if (!list) {
                logDebug(
                  TAG,
                  `Lista com ID ${listId} não encontrada em nenhum lugar`,
                );
                return null;
              }

              // Validar estrutura da lista
              if (!list.items || !Array.isArray(list.items)) {
                logError(
                  TAG,
                  `Lista com ID ${listId} está corrompida, itens inválidos`,
                );
                list.items = [];
              }

              // Recalcular o total da lista para garantir que esteja correto
              if (list.items && list.items.length > 0) {
                const calculatedTotal = calculateTotal(list.items);

                // Se o total calculado for diferente do armazenado, atualizar
                if (calculatedTotal !== list.total) {
                  logDebug(
                    TAG,
                    `Recalculando total da lista ${listId} (${calculatedTotal} vs ${list.total})`,
                  );
                  list = {
                    ...list,
                    total: calculatedTotal,
                  };

                  // Atualizar a lista no estado e persistência
                  try {
                    const updatedLists = lists.map(l =>
                      l.id === list!.id ? list! : l,
                    );

                    setLists(updatedLists);
                    await saveLists(updatedLists);
                    logDebug(
                      TAG,
                      `Lista ${listId} atualizada com novo total ${calculatedTotal}`,
                    );
                  } catch (updateError) {
                    logError(
                      TAG,
                      `Erro ao atualizar lista ${listId}: ${updateError}`,
                    );
                    // Continuar usando a lista com o total recalculado sem interromper
                  }
                }
              }

              return list;
            } catch (err) {
              setError(`Erro ao buscar lista: ${err}`);
              logError(TAG, `Erro ao buscar lista ${listId}: ${err}`);
              return null; // Retornar null em vez de lançar erro para evitar falhas em cascata
            }
          },
          3,
          800,
          TAG,
        );
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

  // Recarregar listas do storage
  const refreshLists = useCallback(async (): Promise<void> => {
    return logPerformance(`${TAG}_refreshLists`, async () => {
      try {
        setLoading(true);

        // Carregar listas do storage
        logDebug(TAG, 'Recarregando listas de compras do storage...');
        const storedLists = await StorageUtil.getItem<ShoppingList[]>(
          STORAGE_KEYS.SHOPPING_LISTS,
          [],
        );

        let parsedLists: ShoppingList[] = [];
        if (Array.isArray(storedLists)) {
          parsedLists = storedLists;
          logDebug(TAG, `${parsedLists.length} listas recarregadas do storage`);

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
          logDebug(TAG, 'Nenhuma lista válida encontrada no storage');
        }

        setLists(parsedLists);
        setError(null);
      } catch (err) {
        setError('Erro ao recarregar listas');
        logError(TAG, `${err}`);
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
