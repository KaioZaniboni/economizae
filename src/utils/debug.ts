/**
 * Utilitários para facilitar a depuração no projeto Economizae
 */

// Variável de controle para habilitar/desabilitar logs em produção
const DEBUG = __DEV__;

/**
 * Log aprimorado que só exibe em desenvolvimento
 * @param tag Identificador do log
 * @param message Mensagem ou objeto para log
 */
export const logDebug = (tag: string, message: any): void => {
  if (DEBUG) {
    if (typeof message === 'object') {
      console.log(`[${tag}]`, JSON.stringify(message, null, 2));
    } else {
      console.log(`[${tag}]`, message);
    }
  }
};

/**
 * Log de erro que só exibe em desenvolvimento
 * @param tag Identificador do log
 * @param error Erro para log
 */
export const logError = (tag: string, error: any): void => {
  if (DEBUG) {
    console.error(`[ERROR][${tag}]`, error);
  }
};

/**
 * Log de performance para funções
 * @param tag Identificador do log
 * @param fn Função a ser executada e medida
 * @returns Resultado da função
 */
export const logPerformance = async <T>(
  tag: string,
  fn: () => Promise<T>,
): Promise<T> => {
  if (!DEBUG) return fn();

  const startTime = performance.now();
  try {
    const result = await fn();
    const endTime = performance.now();
    console.log(`[PERF][${tag}] ${endTime - startTime}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    console.error(`[PERF][${tag}] ${endTime - startTime}ms - Failed with error:`, error);
    throw error;
  }
};

/**
 * Registra alterações de estado para depuração
 * @param component Nome do componente
 * @param prevState Estado anterior
 * @param newState Novo estado
 */
export const logStateChange = (
  component: string,
  prevState: any,
  newState: any
): void => {
  if (DEBUG) {
    console.log(`[STATE][${component}] Changed:`, {
      prev: prevState,
      new: newState,
      diff: Object.keys(newState).filter(
        key => prevState[key] !== newState[key]
      ),
    });
  }
};

/**
 * Adiciona atraso artificial para testar carregamentos
 * (usar apenas em desenvolvimento)
 */
export const simulateDelay = async (ms = 1000): Promise<void> => {
  if (DEBUG) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  return Promise.resolve();
};

export default {
  logDebug,
  logError,
  logPerformance,
  logStateChange,
  simulateDelay,
}; 