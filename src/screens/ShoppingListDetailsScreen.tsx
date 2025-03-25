import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, METRICS } from '../constants';
import { useShoppingList } from '../hooks';
import { Card } from '../components/common';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Item, ShoppingList } from '../types';
import { logDebug, logError } from '../utils/debug';

// Tag para identificar logs deste componente
const TAG = 'ShoppingListDetailsScreen';

// Categorias principais de um supermercado
const CATEGORIES = [
  { id: 'carnes', name: 'Carnes', color: '#F44336' },
  { id: 'hortifruti', name: 'Hortifruti', color: '#4CAF50' },
  { id: 'laticinios', name: 'Laticínios', color: '#FFEB3B' },
  { id: 'padaria', name: 'Padaria', color: '#FF9800' },
  { id: 'bebidas', name: 'Bebidas', color: '#2196F3' },
  { id: 'limpeza', name: 'Limpeza', color: '#03A9F4' },
  { id: 'higiene', name: 'Higiene', color: '#9C27B0' },
  { id: 'enlatados', name: 'Enlatados', color: '#795548' },
  { id: 'congelados', name: 'Congelados', color: '#607D8B' },
  { id: 'outros', name: 'Outros', color: '#9E9E9E' },
];

// Unidades comuns
const UNITS = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'pct'];

type ShoppingListDetailsScreenProps = {
  route: RouteProp<RootStackParamList, 'ShoppingListDetails'>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export const ShoppingListDetailsScreen = ({ route, navigation }: ShoppingListDetailsScreenProps) => {
  const { listId } = route.params;
  const { getListById, addItem, updateItem, deleteItem, updateList } = useShoppingList();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para o novo item
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState('un');
  const [itemPrice, setItemPrice] = useState('');
  const [formattedPrice, setFormattedPrice] = useState('R$ 0,00');
  const [itemCategory, setItemCategory] = useState('outros');

  // Carregar a lista
  const loadList = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getListById(listId);

      if (data) {
        setList(data);

        // Atualizar título da tela
        navigation.setOptions({
          title: data.name,
        });

        // Verificar se o total precisa ser recalculado
        const calculatedTotal = data.items.reduce((sum, item) => {
          if (item.price !== undefined) {
            const itemPrice = parseFloat(String(item.price));
            const itemQuantity = parseInt(String(item.quantity)) || 1;

            if (!isNaN(itemPrice) && !isNaN(itemQuantity)) {
              return sum + (itemPrice * itemQuantity);
            }
          }
          return sum;
        }, 0);

        // Atualizar o total se estiver diferente
        if (calculatedTotal !== data.total) {
          logDebug(TAG, `Atualizando total inconsistente ao carregar: ${calculatedTotal} (era ${data.total})`);
          updateList(listId, {
            ...data,
            total: calculatedTotal,
          });
        }
      } else {
        // Lista não encontrada
        logDebug(TAG, `Lista não encontrada com ID: ${listId}`);
        Alert.alert('Erro', 'Lista não encontrada');
        navigation.goBack();
      }
    } catch (error) {
      logError(TAG, `Erro ao carregar lista: ${error}`);
      Alert.alert('Erro', 'Ocorreu um erro ao carregar os dados da lista');
    } finally {
      setIsLoading(false);
    }
  }, [getListById, listId, navigation, updateList]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Calcular o total e o orçamento
  const calculateTotal = useCallback(() => {
    if (!list || !list.items.length) {return 0;}

    return list.items.reduce((sum, item) => {
      if (item.price !== undefined) {
        // Garantir que o preço e a quantidade sejam valores numéricos válidos
        const itemPrice = parseFloat(String(item.price));
        const itemQuantity = parseInt(String(item.quantity)) || 1;

        if (!isNaN(itemPrice) && !isNaN(itemQuantity)) {
          return sum + (itemPrice * itemQuantity);
        }
      }
      return sum;
    }, 0);
  }, [list]);

  // Verificar se o total está excedendo o orçamento
  const isOverBudget = useCallback(() => {
    if (!list || list.budget === undefined) {return false;}
    return calculateTotal() > list.budget;
  }, [list, calculateTotal]);

  // Atualizar total da lista quando os itens mudarem
  useEffect(() => {
    if (list && list.items.length >= 0) {
      const newTotal = calculateTotal();

      // Apenas atualizar se houver mudança no total
      if (newTotal !== list.total) {
        try {
          // Usar setTimeout para evitar atualização em cascata
          const timeoutId = setTimeout(() => {
            updateList(listId, {
              ...list,
              total: newTotal,
            });
            logDebug(TAG, `Total da lista atualizado: ${newTotal}`);
          }, 100);

          return () => clearTimeout(timeoutId);
        } catch (error) {
          logError(TAG, `Erro ao atualizar total da lista: ${error}`);
        }
      }
    }
  }, [list?.items, list, listId, updateList, calculateTotal]);

  // Formatar o valor monetário
  const formatCurrency = (value: string) => {
    // Remover todos os caracteres não numéricos
    let numericValue = value.replace(/[^0-9]/g, '');

    // Se não há valor, retorna o formato inicial R$ 0,00
    if (numericValue.length === 0) {
      return 'R$ 0,00';
    }

    // Formatar como uma calculadora
    numericValue = numericValue.padStart(3, '0');
    const cents = numericValue.slice(-2);
    let integerPart = numericValue.slice(0, -2);
    integerPart = integerPart === '0' || integerPart === '' ? '0' : integerPart.replace(/^0+/, '');

    // Formatar a parte inteira com separadores de milhar
    let formattedInteger = '';
    if (integerPart.length > 0) {
      for (let i = 0; i < integerPart.length; i++) {
        if (i > 0 && (integerPart.length - i) % 3 === 0) {
          formattedInteger += '.';
        }
        formattedInteger += integerPart[i];
      }
    } else {
      formattedInteger = '0';
    }

    return `R$ ${formattedInteger},${cents}`;
  };

  // Atualizar o valor formatado quando o campo for preenchido
  const handlePriceChange = (value: string) => {
    // Se o valor estiver vazio, inicializar com valor zero
    if (!value) {
      setItemPrice('');
      setFormattedPrice('R$ 0,00');
      return;
    }

    // Se o usuário apagar até o símbolo da moeda, reiniciar com valor zero
    if (value === 'R$ ' || value === 'R$' || value === 'R') {
      setItemPrice('');
      setFormattedPrice('R$ 0,00');
      return;
    }

    // Extrair apenas os números do valor
    const numericValue = value.replace(/[^0-9]/g, '');

    // Armazenar o valor numérico real para submissão
    setItemPrice(numericValue);

    // Formatar para exibição
    setFormattedPrice(formatCurrency(numericValue));
  };

  // Abrir modal para adicionar um novo item
  const handleAddItem = () => {
    // Resetar os campos
    setItemName('');
    setItemQuantity('1');
    setItemUnit('un');
    setItemPrice('');
    setFormattedPrice('R$ 0,00');
    setItemCategory('outros');
    setEditingItem(null);
    setModalVisible(true);
  };

  // Abrir modal para editar um item existente
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity.toString());
    setItemUnit(item.unit);

    if (item.price !== undefined) {
      const priceInCents = Math.round(item.price * 100).toString();
      setItemPrice(priceInCents);
      setFormattedPrice(formatCurrency(priceInCents));
    } else {
      setItemPrice('');
      setFormattedPrice('R$ 0,00');
    }

    setItemCategory(item.category || 'outros');
    setModalVisible(true);
  };

  // Salvar o item (adicionar novo ou atualizar existente)
  const handleSaveItem = () => {
    if (!itemName.trim()) {
      Alert.alert('Erro', 'O nome do item é obrigatório');
      return;
    }

    const quantity = parseInt(itemQuantity) || 1;
    if (quantity <= 0) {
      Alert.alert('Erro', 'A quantidade deve ser maior que zero');
      return;
    }

    // Converter o preço para número
    let price: number | undefined;
    if (itemPrice) {
      price = parseFloat(itemPrice) / 100;
      if (isNaN(price)) {
        Alert.alert('Erro', 'Por favor, digite um valor válido para o preço');
        return;
      }
    }

    try {
      if (editingItem) {
        // Atualizar item existente
        updateItem(listId, editingItem.id, {
          name: itemName.trim(),
          quantity,
          unit: itemUnit,
          price,
          category: itemCategory,
        });
      } else {
        // Adicionar novo item
        addItem(listId, {
          name: itemName.trim(),
          quantity,
          unit: itemUnit,
          price,
          category: itemCategory,
        });
      }

      // Fechar o modal e atualizar a lista
      setModalVisible(false);
      loadList();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o item');
    }
  };

  // Excluir um item
  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            try {
              deleteItem(listId, itemId);
              loadList();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o item');
            }
          },
        },
      ]
    );
  };

  // Alternar o estado de marcação do item
  const toggleItemCheck = async (itemId: string, checked: boolean) => {
    try {
      await updateItem(listId, itemId, { checked: !checked });
      loadList();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o item');
    }
  };

  // Renderizar categoria
  const renderCategory = ({ item: category }: { item: typeof CATEGORIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { backgroundColor: category.color + '30' }, // Cor com transparência
        itemCategory === category.id && { borderColor: category.color, borderWidth: 2 },
      ]}
      onPress={() => setItemCategory(category.id)}
    >
      <Text style={styles.categoryText}>{category.name}</Text>
    </TouchableOpacity>
  );

  // Renderizar unidade
  const renderUnit = ({ item: unit }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.unitItem,
        itemUnit === unit && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
      ]}
      onPress={() => setItemUnit(unit)}
    >
      <Text
        style={[styles.unitText, itemUnit === unit && { color: COLORS.background }]}
      >
        {unit}
      </Text>
    </TouchableOpacity>
  );

  // Renderizar item da lista
  const renderListItem = ({ item }: { item: Item }) => {
    // Encontrar a categoria para obter a cor
    const category = CATEGORIES.find(cat => cat.id === (item.category || 'outros'));
    const categoryColor = category?.color || COLORS.textLight;

    return (
      <Card style={[styles.itemCard, item.checked && styles.checkedItem]}>
        <TouchableOpacity
          style={styles.checkBox}
          onPress={() => toggleItemCheck(item.id, item.checked)}
        >
          <View
            style={[
              styles.checkBoxInner,
              item.checked && { backgroundColor: COLORS.primary },
            ]}
          />
        </TouchableOpacity>

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, item.checked && styles.checkedText]}>{item.name}</Text>
            <View style={[styles.categoryTag, { backgroundColor: categoryColor + '30' }]}>
              <Text style={[styles.categoryTagText, { color: categoryColor }]}>
                {category?.name || 'Outros'}
              </Text>
            </View>
          </View>

          <View style={styles.itemDetails}>
            <Text style={styles.itemQuantity}>
              {item.quantity} {item.unit}
            </Text>

            {item.price !== undefined && (
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>
                  R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </Text>

                {item.quantity > 1 && (
                  <Text style={styles.unitPrice}>
                    (R$ {item.price.toFixed(2).replace('.', ',')}/un)
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditItem(item)}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteItem(item.id)}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!list) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Lista não encontrada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho com orçamento e total */}
      <View style={styles.header}>
        <View style={styles.budgetContainer}>
          <Text style={styles.label}>Orçamento:</Text>
          <Text style={styles.budgetValue}>
            {list.budget !== undefined
              ? `R$ ${list.budget.toFixed(2).replace('.', ',')}`
              : 'Não definido'}
          </Text>
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.label}>Total:</Text>
          <Text style={[
            styles.totalValue,
            isOverBudget() && styles.overBudget,
          ]}>
            {list.total !== undefined
              ? `R$ ${list.total.toFixed(2).replace('.', ',')}`
              : 'R$ 0,00'}
          </Text>
        </View>
      </View>

      {/* Lista de itens */}
      {list.items.length > 0 ? (
        <FlatList
          data={list.items}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum item na lista</Text>
          <Text style={styles.emptySubtext}>Toque no botão + para adicionar itens</Text>
        </View>
      )}

      {/* Botão para adicionar item */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddItem}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal para adicionar/editar item */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nome do item</Text>
              <TextInput
                style={styles.textInput}
                value={itemName}
                onChangeText={setItemName}
                placeholder="Ex: Arroz, Leite, Sabonete..."
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Quantidade</Text>
                <TextInput
                  style={styles.textInput}
                  value={itemQuantity}
                  onChangeText={setItemQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Unidade</Text>
                <View>
                  <FlatList
                    data={UNITS}
                    renderItem={renderUnit}
                    keyExtractor={(item) => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.unitList}
                  />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Preço</Text>
              <TextInput
                style={styles.textInput}
                value={formattedPrice}
                onChangeText={handlePriceChange}
                keyboardType="numeric"
                placeholder="R$ 0,00"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Categoria</Text>
              <FlatList
                data={CATEGORIES}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: METRICS.padding.md,
    backgroundColor: COLORS.background,
    elevation: 8,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  budgetContainer: {
    flex: 1,
    marginRight: 8,
  },
  totalContainer: {
    flex: 1,
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  overBudget: {
    color: COLORS.error,
  },
  listContainer: {
    padding: METRICS.padding.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: METRICS.padding.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: METRICS.padding.lg,
    bottom: METRICS.padding.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 24,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  itemCard: {
    flexDirection: 'row',
    padding: METRICS.padding.sm,
    marginBottom: METRICS.margin.sm,
    borderRadius: METRICS.borderRadii.md,
    backgroundColor: COLORS.background,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 12,
  },
  checkedItem: {
    opacity: 0.7,
    backgroundColor: COLORS.backgroundLight,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkBoxInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: METRICS.borderRadii.sm,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  unitPrice: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: METRICS.borderRadii.lg,
    borderTopRightRadius: METRICS.borderRadii.lg,
    padding: METRICS.padding.md,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: METRICS.margin.md,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: METRICS.margin.md,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: METRICS.margin.md,
  },
  formLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.textLight,
    borderRadius: METRICS.borderRadii.sm,
    padding: METRICS.padding.sm,
    backgroundColor: COLORS.backgroundLight,
    color: COLORS.text,
  },
  unitList: {
    paddingVertical: 8,
  },
  unitItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: METRICS.borderRadii.md,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    backgroundColor: COLORS.backgroundLight,
  },
  unitText: {
    fontSize: 14,
    color: COLORS.text,
  },
  categoryList: {
    paddingVertical: 8,
  },
  categoryItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: METRICS.borderRadii.md,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: METRICS.margin.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: METRICS.borderRadii.md,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  saveButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundLight,
    marginRight: 8,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
