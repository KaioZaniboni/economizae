import {useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logDebug} from '../utils/debug';

const TAG = 'useSectionCollapse';

/**
 * Hook para gerenciar o estado de colapso de seções com persistência
 * Armazena o estado de colapso no AsyncStorage para recuperação entre sessões
 *
 * @param initialSections Array de identificadores de seções
 * @param defaultCollapsed Estado inicial das seções (true = colapsado)
 * @param storageKey Chave única para salvar o estado no AsyncStorage (ex: 'collapsedSections-list-123')
 * @returns Objeto com estado e funções de manipulação
 */
export const useSectionCollapse = <T extends string>(
  initialSections: T[],
  defaultCollapsed: boolean = false, // Por padrão, as seções começam abertas
  storageKey: string,
) => {
  // Estado com inicialização direta que será sobrescrito posteriormente
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    initialSections.forEach(sectionId => {
      initialState[sectionId] = defaultCollapsed;
    });
    logDebug(
      TAG,
      `Estado inicial temporário criado para "${storageKey}": ${
        Object.keys(initialState).length
      } seções`,
    );
    return initialState;
  });

  // Carregar o estado salvo do AsyncStorage
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(storageKey);

        if (savedState) {
          const parsedState = JSON.parse(savedState);
          logDebug(
            TAG,
            `Estado carregado do AsyncStorage para "${storageKey}": ${
              Object.keys(parsedState).length
            } seções`,
          );

          // Garantir que todas as seções estejam no estado
          const updatedState = {...parsedState};
          let stateChanged = false;

          initialSections.forEach(sectionId => {
            if (updatedState[sectionId] === undefined) {
              updatedState[sectionId] = defaultCollapsed;
              stateChanged = true;
              logDebug(
                TAG,
                `Nova seção "${sectionId}" adicionada ao estado carregado: ${defaultCollapsed}`,
              );
            }
          });

          setCollapsedSections(updatedState);

          // Se o estado foi modificado, salvar novamente
          if (stateChanged) {
            try {
              await AsyncStorage.setItem(
                storageKey,
                JSON.stringify(updatedState),
              );
              logDebug(TAG, `Estado atualizado salvo para "${storageKey}"`);
            } catch (error) {
              logDebug(TAG, `Erro ao salvar estado atualizado: ${error}`);
            }
          }
        } else {
          logDebug(
            TAG,
            `Nenhum estado salvo encontrado para "${storageKey}", usando defaults`,
          );
        }
      } catch (error) {
        logDebug(TAG, `Erro ao carregar estado do AsyncStorage: ${error}`);
      }
    };

    loadSavedState();
  }, [storageKey, initialSections, defaultCollapsed]);

  // Salvar o estado no AsyncStorage sempre que mudar
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(collapsedSections),
        );
        logDebug(TAG, `Estado salvo no AsyncStorage para "${storageKey}"`);
      } catch (error) {
        logDebug(TAG, `Erro ao salvar estado no AsyncStorage: ${error}`);
      }
    };

    // Se o estado não está vazio (já inicializado), salve-o
    if (Object.keys(collapsedSections).length > 0) {
      saveState();
    }
  }, [collapsedSections, storageKey]);

  // Adicionar novas seções quando a lista de seções mudar
  useEffect(() => {
    setCollapsedSections(prev => {
      const updatedState = {...prev};
      let changed = false;

      initialSections.forEach(sectionId => {
        if (updatedState[sectionId] === undefined) {
          updatedState[sectionId] = defaultCollapsed;
          changed = true;
          logDebug(
            TAG,
            `Nova seção adicionada: ${sectionId}, defaultCollapsed=${defaultCollapsed}`,
          );
        }
      });

      return changed ? updatedState : prev;
    });
  }, [initialSections, defaultCollapsed]);

  // Alternar todas as seções de uma vez
  const toggleAll = useCallback(() => {
    setCollapsedSections(prev => {
      // Verificar se a maioria das seções está colapsada
      const totalSections = Object.keys(prev).length;
      const collapsedCount = Object.values(prev).filter(Boolean).length;
      const mostlyCollapsed = collapsedCount > totalSections / 2;

      // Se a maioria está colapsada, expandir todas, senão colapsar todas
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = !mostlyCollapsed;
      });

      logDebug(
        TAG,
        `Toggle todas as seções para "${storageKey}": ${
          mostlyCollapsed ? 'expandindo todas' : 'colapsando todas'
        }`,
      );

      return newState;
    });
  }, [storageKey]);

  // Alternar uma seção individual ou todas as seções
  const toggleSection = useCallback(
    (sectionId: T | null) => {
      if (sectionId === null) {
        // Se sectionId for null, alterna todas as seções ao mesmo tempo
        toggleAll();
        return;
      }

      setCollapsedSections(prev => {
        const newValue = !prev[sectionId];
        logDebug(
          TAG,
          `Toggle seção ${sectionId}: ${prev[sectionId]} -> ${newValue}`,
        );
        return {...prev, [sectionId]: newValue};
      });
    },
    [toggleAll],
  );

  // Expandir todas as seções
  const expandAll = useCallback(() => {
    logDebug(TAG, `Expandindo todas as seções para "${storageKey}"`);
    setCollapsedSections(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      return newState;
    });
  }, [storageKey]);

  // Colapsar todas as seções
  const collapseAll = useCallback(() => {
    logDebug(TAG, `Colapsando todas as seções para "${storageKey}"`);
    setCollapsedSections(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = true;
      });
      return newState;
    });
  }, [storageKey]);

  // Verificar o estado de colapso de uma seção
  const isCollapsed = useCallback(
    (sectionId: T) => {
      const result = Boolean(collapsedSections[sectionId]);
      return result;
    },
    [collapsedSections],
  );

  return {
    sections: initialSections,
    collapsedSections,
    toggleSection,
    toggleAll,
    expandAll,
    collapseAll,
    isCollapsed,
  };
};

export default useSectionCollapse;
