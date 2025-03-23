import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves para armazenamento
const STORAGE_KEYS = {
  SHOPPING_LISTS: '@Economizae:shoppingLists',
  USER_PREFERENCES: '@Economizae:userPreferences',
  APP_SETTINGS: '@Economizae:appSettings',
};

/**
 * Salva um valor no AsyncStorage
 */
export const storeData = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    throw error;
  }
};

/**
 * Recupera um valor do AsyncStorage
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Erro ao recuperar dados:', error);
    throw error;
  }
};

/**
 * Remove um valor do AsyncStorage
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Erro ao remover dados:', error);
    throw error;
  }
};

/**
 * Limpa todos os dados do AsyncStorage
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Erro ao limpar todos os dados:', error);
    throw error;
  }
};

// Funções específicas para listas de compras
export const saveShoppingLists = async (lists: unknown): Promise<void> => {
  return storeData(STORAGE_KEYS.SHOPPING_LISTS, lists);
};

export const getShoppingLists = async <T>(): Promise<T | null> => {
  return getData<T>(STORAGE_KEYS.SHOPPING_LISTS);
};

// Funções específicas para preferências do usuário
export const saveUserPreferences = async (preferences: unknown): Promise<void> => {
  return storeData(STORAGE_KEYS.USER_PREFERENCES, preferences);
};

export const getUserPreferences = async <T>(): Promise<T | null> => {
  return getData<T>(STORAGE_KEYS.USER_PREFERENCES);
};

// Funções específicas para configurações do aplicativo
export const saveAppSettings = async (settings: unknown): Promise<void> => {
  return storeData(STORAGE_KEYS.APP_SETTINGS, settings);
};

export const getAppSettings = async <T>(): Promise<T | null> => {
  return getData<T>(STORAGE_KEYS.APP_SETTINGS);
}; 