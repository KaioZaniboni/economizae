import {useState, useEffect, useCallback} from 'react';
import {logDebug} from '../utils/debug';

const TAG = 'useSectionCollapse';

/**
 * Hook simplificado para gerenciar o estado de colapso de seções
 * Abordagem direta para minimizar problemas de renderização
 *
 * @param initialSections Array de identificadores de seções
 * @param defaultCollapsed Estado inicial das seções (true = colapsado)
 * @returns Objeto com estado e funções de manipulação
 */
export const useSectionCollapse = <T extends string>(
  initialSections: T[],
  defaultCollapsed: boolean = false, // Por padrão, as seções começam abertas
) => {
  // Estado simples com inicialização direta
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    initialSections.forEach(sectionId => {
      initialState[sectionId] = defaultCollapsed;
    });
    logDebug(
      TAG,
      `Estado inicial criado: ${
        Object.keys(initialState).length
      } seções, defaultCollapsed=${defaultCollapsed}`,
    );
    return initialState;
  });

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

  // Alternar uma seção individual
  const toggleSection = useCallback((sectionId: T) => {
    setCollapsedSections(prev => {
      const newValue = !prev[sectionId];
      logDebug(
        TAG,
        `Toggle seção ${sectionId}: ${prev[sectionId]} -> ${newValue}`,
      );
      return {...prev, [sectionId]: newValue};
    });
  }, []);

  // Expandir todas as seções
  const expandAll = useCallback(() => {
    logDebug(TAG, 'Expandindo todas as seções');
    setCollapsedSections(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      return newState;
    });
  }, []);

  // Colapsar todas as seções
  const collapseAll = useCallback(() => {
    logDebug(TAG, 'Colapsando todas as seções');
    setCollapsedSections(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        newState[key] = true;
      });
      return newState;
    });
  }, []);

  // Verificar o estado de colapso de uma seção
  const isSectionCollapsed = useCallback(
    (sectionId: T) => {
      const result = Boolean(collapsedSections[sectionId]);
      logDebug(
        TAG,
        `Verificando se seção ${sectionId} está colapsada: ${result}`,
      );
      return result;
    },
    [collapsedSections],
  );

  return {
    collapsedSections,
    toggleSection,
    expandAll,
    collapseAll,
    isSectionCollapsed,
  };
};

export default useSectionCollapse;
