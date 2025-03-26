import AsyncStorage from '@react-native-async-storage/async-storage';
import {logDebug, logError} from './debug';
import {StorageError, withRetry} from './errorHandler';

// Tag para logs
const TAG = 'StorageUtil';

// Chaves para armazenamento
export const STORAGE_KEYS = {
  SHOPPING_LISTS: '@Economizae:shoppingLists',
  USER_PREFERENCES: '@Economizae:userPreferences',
  APP_SETTINGS: '@Economizae:appSettings',
};

/**
 * Utilitário para gerenciar operações do AsyncStorage com maior segurança
 */
export class StorageUtil {
  /**
   * Salva um objeto no AsyncStorage com segurança e verificação
   * @param key Chave para armazenamento
   * @param data Dados a serem salvos
   * @param withBackup Se deve criar um backup dos dados anteriores
   */
  static async setItem(
    key: string,
    data: any,
    withBackup: boolean = true,
  ): Promise<void> {
    try {
      if (!key) {
        throw new StorageError('Chave de armazenamento não pode ser vazia');
      }

      const jsonValue = JSON.stringify(data);

      // Se ativado, salva uma cópia de backup antes de sobrescrever
      if (withBackup) {
        try {
          const existingData = await AsyncStorage.getItem(key);
          if (existingData) {
            await AsyncStorage.setItem(`${key}_backup`, existingData);
            logDebug(TAG, `Backup criado para ${key}`);
          }
        } catch (backupError) {
          logError(TAG, `Falha ao criar backup para ${key}: ${backupError}`);
          // Continue mesmo se o backup falhar
        }
      }

      // Salva os dados usando retry para maior segurança
      await withRetry(
        async () => {
          await AsyncStorage.setItem(key, jsonValue);

          // Validação: lê os dados novamente para confirmar que foram salvos corretamente
          const savedValue = await AsyncStorage.getItem(key);
          if (savedValue !== jsonValue) {
            throw new StorageError(`Falha na validação de dados para ${key}`);
          }
        },
        2,
        500,
        TAG,
      );

      logDebug(TAG, `Dados salvos com sucesso em ${key}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logError(TAG, `Erro ao salvar dados em ${key}: ${errorMessage}`);
      throw new StorageError(`Falha ao salvar em ${key}: ${errorMessage}`);
    }
  }

  /**
   * Obtém um objeto do AsyncStorage com segurança
   * @param key Chave para busca
   * @param defaultValue Valor padrão caso não exista
   * @param useBackupOnFailure Se deve tentar usar o backup em caso de falha
   * @returns Dados armazenados ou valor padrão
   */
  static async getItem<T>(
    key: string,
    defaultValue: T | null = null,
    useBackupOnFailure: boolean = true,
  ): Promise<T | null> {
    try {
      if (!key) {
        throw new StorageError('Chave de armazenamento não pode ser vazia');
      }

      // Tenta obter os dados normalmente
      const jsonValue = await AsyncStorage.getItem(key);

      if (jsonValue === null) {
        logDebug(TAG, `Nenhum dado encontrado para ${key}`);
        return defaultValue;
      }

      try {
        const parsedValue = JSON.parse(jsonValue) as T;
        logDebug(TAG, `Dados recuperados com sucesso de ${key}`);
        return parsedValue;
      } catch (parseError) {
        logError(TAG, `Erro ao parsear dados de ${key}: ${parseError}`);

        // Se habilitado, tenta recuperar do backup
        if (useBackupOnFailure) {
          logDebug(TAG, `Tentando recuperar do backup para ${key}`);
          const backupValue = await AsyncStorage.getItem(`${key}_backup`);

          if (backupValue) {
            try {
              const parsedBackup = JSON.parse(backupValue) as T;
              logDebug(TAG, `Dados recuperados do backup para ${key}`);

              // Restaura o backup como principal
              await AsyncStorage.setItem(key, backupValue);
              logDebug(TAG, `Backup restaurado como principal para ${key}`);

              return parsedBackup;
            } catch (backupParseError) {
              logError(
                TAG,
                `Erro ao parsear backup para ${key}: ${backupParseError}`,
              );
            }
          }
        }

        throw parseError;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logError(TAG, `Erro ao buscar dados de ${key}: ${errorMessage}`);
      return defaultValue;
    }
  }

  /**
   * Remove um item do AsyncStorage
   * @param key Chave a ser removida
   * @param keepBackup Se deve manter o backup
   */
  static async removeItem(
    key: string,
    keepBackup: boolean = false,
  ): Promise<void> {
    try {
      if (!key) {
        return;
      }

      await AsyncStorage.removeItem(key);

      if (!keepBackup) {
        await AsyncStorage.removeItem(`${key}_backup`);
      }

      logDebug(TAG, `Item ${key} removido com sucesso`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logError(TAG, `Erro ao remover ${key}: ${errorMessage}`);
    }
  }

  /**
   * Limpa o storage mas mantém backups importantes
   */
  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.endsWith('_backup'));

      await AsyncStorage.clear();

      // Restaurar os backups
      for (const backupKey of backupKeys) {
        const value = await AsyncStorage.getItem(backupKey);
        if (value) {
          const originalKey = backupKey.replace('_backup', '');
          await AsyncStorage.setItem(originalKey, value);
          await AsyncStorage.setItem(backupKey, value);
        }
      }

      logDebug(TAG, 'Storage limpo mantendo backups');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logError(TAG, `Erro ao limpar storage: ${errorMessage}`);
    }
  }
}

// Funções específicas para listas de compras
export const saveShoppingLists = async (lists: unknown): Promise<void> => {
  return StorageUtil.setItem(STORAGE_KEYS.SHOPPING_LISTS, lists);
};

export const getShoppingLists = async <T>(): Promise<T | null> => {
  return StorageUtil.getItem<T>(STORAGE_KEYS.SHOPPING_LISTS);
};

// Funções específicas para preferências do usuário
export const saveUserPreferences = async (
  preferences: unknown,
): Promise<void> => {
  return StorageUtil.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
};

export const getUserPreferences = async <T>(): Promise<T | null> => {
  return StorageUtil.getItem<T>(STORAGE_KEYS.USER_PREFERENCES);
};

// Funções específicas para configurações do aplicativo
export const saveAppSettings = async (settings: unknown): Promise<void> => {
  return StorageUtil.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
};

export const getAppSettings = async <T>(): Promise<T | null> => {
  return StorageUtil.getItem<T>(STORAGE_KEYS.APP_SETTINGS);
};
