import {logError} from './debug';

/**
 * Classes de erro customizadas para melhor gerenciamento de erros
 */
export class AppError extends Error {
  code: string;
  isOperational: boolean;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class DataError extends AppError {
  constructor(message: string) {
    super(message, 'DATA_ERROR');
    this.name = 'DataError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Função para executar uma operação com retry automático
 * @param operation Função a ser executada
 * @param retryCount Número máximo de tentativas
 * @param delayMs Atraso entre tentativas em ms
 * @param tag Tag para log
 * @returns Resultado da operação
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retryCount: number = 3,
  delayMs: number = 1000,
  tag: string = 'RetryOperation',
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isLastAttempt = attempt === retryCount;
      if (!isLastAttempt) {
        logError(
          tag,
          `Tentativa ${attempt}/${retryCount} falhou: ${lastError.message}. Tentando novamente em ${delayMs}ms...`,
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Operação falhou após múltiplas tentativas');
}

/**
 * Trata operações assíncronas de forma segura
 * @param promise Promise a ser executada
 * @returns Array com erro e resultado
 */
export async function safeAsync<T>(
  promise: Promise<T>,
): Promise<[Error | null, T | null]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error instanceof Error ? error : new Error(String(error)), null];
  }
}

/**
 * Valida estrutura básica de dados para evitar erros
 * @param data Dados a serem validados
 * @param requiredFields Campos obrigatórios
 * @returns Booleano indicando se os dados são válidos
 */
export function validateData(
  data: any,
  requiredFields: string[] = [],
): boolean {
  if (!data) {
    return false;
  }

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      return false;
    }
  }

  return true;
}
