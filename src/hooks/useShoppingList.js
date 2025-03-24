import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useShoppingList = () => {
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const STORAGE_KEY = 'shoppingLists';

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const storedLists = await AsyncStorage.getItem(STORAGE_KEY);
                if (storedLists) {
                    setLists(JSON.parse(storedLists));
                }
            } catch (error) {
                console.error('Erro ao buscar listas:', error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, []);

    const createList = async (listName) => {
        try {
            const newList = {
                id: Date.now().toString(),
                name: listName,
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const updatedLists = [...lists, newList];
            setLists(updatedLists);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));

            return newList;
        } catch (error) {
            console.error('Erro ao criar lista:', error);
            throw error;
        }
    };

    const addItem = async (listId, itemName) => {
        try {
            const updatedLists = lists.map(list =>
                list.id === listId ? {
                    ...list,
                    items: [...list.items, { id: Date.now().toString(), name: itemName, checked: false }],
                    updatedAt: new Date().toISOString(),
                } : list
            );

            setLists(updatedLists);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));

            return updatedLists.find(list => list.id === listId);
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            throw error;
        }
    };

    const updateItem = async (listId, itemId, updates) => {
        try {
            const updatedLists = lists.map(list =>
                list.id === listId ? {
                    ...list,
                    items: list.items.map(item =>
                        item.id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
                    ),
                    updatedAt: new Date().toISOString(),
                } : list
            );

            setLists(updatedLists);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));

            return updatedLists.find(list => list.id === listId);
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            throw error;
        }
    };

    const removeItem = async (listId, itemId) => {
        try {
            const updatedLists = lists.map(list =>
                list.id === listId ? {
                    ...list,
                    items: list.items.filter(item => item.id !== itemId),
                    updatedAt: new Date().toISOString(),
                } : list
            );

            setLists(updatedLists);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));

            return updatedLists.find(list => list.id === listId);
        } catch (error) {
            console.error('Erro ao remover item:', error);
            throw error;
        }
    };

    const toggleItemCheck = async (listId, itemId) => {
        try {
            const updatedLists = lists.map(list =>
                list.id === listId ? {
                    ...list,
                    items: list.items.map(item =>
                        item.id === itemId ? { ...item, checked: !item.checked, updatedAt: new Date().toISOString() } : item
                    ),
                    updatedAt: new Date().toISOString(),
                } : list
            );

            setLists(updatedLists);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));

            return updatedLists.find(list => list.id === listId);
        } catch (error) {
            console.error('Erro ao alternar o estado do item:', error);
            throw error;
        }
    };

    const updateList = async (listId, updates) => {
        try {
            const listIndex = lists.findIndex(list => list.id === listId);

            if (listIndex === -1) {
                throw new Error('Lista não encontrada');
            }

            const updatedList = {
                ...lists[listIndex],
                ...updates,
                updatedAt: new Date().toISOString(),
            };

            const updatedLists = [...lists];
            updatedLists[listIndex] = updatedList;

            setLists(updatedLists);

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));

            return updatedList;
        } catch (error) {
            console.error('Erro ao atualizar lista:', error);
            throw error;
        }
    };

    const deleteList = async (listId) => {
        try {
            const filteredLists = lists.filter(list => list.id !== listId);

            if (filteredLists.length === lists.length) {
                throw new Error('Lista não encontrada');
            }

            setLists(filteredLists);

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLists));

            return true;
        } catch (error) {
            console.error('Erro ao excluir lista:', error);
            throw error;
        }
    };

    return {
        lists,
        loading,
        error,
        createList,
        addItem,
        updateItem,
        removeItem,
        toggleItemCheck,
        updateList,
        deleteList,
    };
};
