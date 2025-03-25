import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, METRICS } from '../constants';
import { useShoppingList } from '../hooks';
import { Card, Button } from '../components/common';
import { ShoppingList } from '../types';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export const HomeScreen = () => {
  const { lists, loading, error, createList, updateList, deleteList, refreshLists } = useShoppingList();
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListBudget, setNewListBudget] = useState('');
  const [formattedBudget, setFormattedBudget] = useState('');
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Atualizar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsRefreshing(true);
        try {
          // Recarregar as listas do AsyncStorage
          await refreshLists();
        } catch (error) {
          console.error('Erro ao atualizar listas:', error);
        } finally {
          setIsRefreshing(false);
        }
      };

      loadData();

      // Função de limpeza para o efeito (opcional)
      return () => {};
    }, [refreshLists])
  );

  // Formatar o valor monetário quando o usuário digita
  const formatCurrency = (value: string) => {
    // Remover todos os caracteres não numéricos
    let numericValue = value.replace(/[^0-9]/g, '');

    // Se não há valor, retorna o formato inicial R$ 0,00
    if (numericValue.length === 0) {
      return 'R$ 0,00';
    }

    // Formatar como uma calculadora, onde cada dígito inserido se move da direita para a esquerda
    // Exemplo: 1 -> R$ 0,01, 12 -> R$ 0,12, 123 -> R$ 1,23, 1234 -> R$ 12,34...

    // Garantir que temos no mínimo 3 dígitos (para ter 0,XX)
    numericValue = numericValue.padStart(3, '0');

    // Separar os centavos (2 últimos dígitos)
    const cents = numericValue.slice(-2);

    // Obter a parte inteira sem zeros à esquerda desnecessários
    let integerPart = numericValue.slice(0, -2);

    // Remover zeros à esquerda da parte inteira (exceto se for apenas 0)
    integerPart = integerPart === '0' || integerPart === '' ? '0' : integerPart.replace(/^0+/, '');

    // Formatar a parte inteira com separadores de milhar
    let formattedInteger = '';

    // Se houver dígitos na parte inteira, adicionar separadores
    if (integerPart.length > 0) {
      for (let i = 0; i < integerPart.length; i++) {
        // Adicionar ponto a cada 3 dígitos da direita para a esquerda
        if (i > 0 && (integerPart.length - i) % 3 === 0) {
          formattedInteger += '.';
        }
        formattedInteger += integerPart[i];
      }
    } else {
      formattedInteger = '0';
    }

    // Retornar o valor formatado
    return `R$ ${formattedInteger},${cents}`;
  };

  // Atualizar o valor formatado quando o campo for preenchido
  const handleBudgetChange = (value: string) => {
    // Se o valor estiver vazio, inicializar com valor zero
    if (!value) {
      setNewListBudget('');
      setFormattedBudget('R$ 0,00');
      return;
    }

    // Se o usuário apagar até o símbolo da moeda, reiniciar com valor zero
    if (value === 'R$ ' || value === 'R$' || value === 'R') {
      setNewListBudget('');
      setFormattedBudget('R$ 0,00');
      return;
    }

    // Extrair apenas os números do valor
    const numericValue = value.replace(/[^0-9]/g, '');

    // Armazenar o valor numérico real para submissão
    setNewListBudget(numericValue);

    // Formatar para exibição
    setFormattedBudget(formatCurrency(numericValue));
  };

  const handleCreateList = () => {
    // Limpar campos antes de mostrar o modal
    setNewListName('');
    setNewListBudget('');
    setFormattedBudget('R$ 0,00');

    // Mostra um modal para obter o nome da lista
    setModalVisible(true);
  };

  const confirmCreateList = () => {
    if (newListName && newListName.trim()) {
      // Converter o orçamento para número, se fornecido
      let budget: number | undefined;

      if (newListBudget) {
        // Verificar se o valor é apenas zeros (0,00)
        const isZeroValue = /^0*$/.test(newListBudget);

        // Converter o valor para número (dividindo por 100 para ter o valor correto)
        budget = parseFloat(newListBudget) / 100;

        // Validar se o orçamento é um número válido
        if (isNaN(budget)) {
          Alert.alert('Erro', 'Por favor, digite um valor válido para o orçamento');
          return;
        }

        // Se o valor for 0,00, considerar como undefined (sem orçamento)
        if (isZeroValue || budget === 0) {
          budget = undefined;
        }
      }

      try {
        createList(newListName.trim(), budget);
        setNewListName('');
        setNewListBudget('');
        setFormattedBudget('R$ 0,00');
        setModalVisible(false);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível criar a lista');
      }
    } else {
      Alert.alert('Erro', 'Por favor, digite um nome para a lista');
    }
  };

  // Alternar a seleção de uma lista
  const toggleListSelection = (listId: string) => {
    const newSelectedLists = new Set(selectedLists);

    if (newSelectedLists.has(listId)) {
      newSelectedLists.delete(listId);
    } else {
      newSelectedLists.add(listId);
    }

    setSelectedLists(newSelectedLists);

    // Se não há mais itens selecionados, sair do modo de seleção
    if (newSelectedLists.size === 0) {
      setSelectionMode(false);
    } else if (!selectionMode) {
      setSelectionMode(true);
    }
  };

  // Cancelar o modo de seleção
  const cancelSelectionMode = () => {
    setSelectionMode(false);
    setSelectedLists(new Set());
  };

  // Editar a lista selecionada (apenas uma)
  const handleEditSelected = () => {
    if (selectedLists.size !== 1) {
      Alert.alert('Aviso', 'Selecione apenas uma lista para editar');
      return;
    }

    const listId = Array.from(selectedLists)[0];
    const listToEdit = lists.find(list => list.id === listId);

    if (listToEdit) {
      handleEditList(listToEdit);
    }
  };

  const handleEditList = (list: ShoppingList) => {
    setSelectedList(list);
    setNewListName(list.name);

    // Formatar o orçamento para exibição
    if (list.budget !== undefined) {
      // Converter o orçamento para centavos (formato numérico para o estado)
      const budgetInCents = Math.round(list.budget * 100).toString();
      setNewListBudget(budgetInCents);
      // Formatar para exibição
      setFormattedBudget(formatCurrency(budgetInCents));
    } else {
      setNewListBudget('');
      setFormattedBudget('R$ 0,00');
    }

    setEditModalVisible(true);
    // Limpar a seleção após abrir o modal de edição
    cancelSelectionMode();
  };

  const confirmEditList = () => {
    if (!selectedList) {return;}

    if (newListName && newListName.trim()) {
      // Converter o orçamento para número, se fornecido
      let budget: number | undefined;

      if (newListBudget) {
        // Verificar se o valor é apenas zeros (0,00)
        const isZeroValue = /^0*$/.test(newListBudget);

        // Converter o valor para número (dividindo por 100 para ter o valor correto)
        budget = parseFloat(newListBudget) / 100;

        // Validar se o orçamento é um número válido
        if (isNaN(budget)) {
          Alert.alert('Erro', 'Por favor, digite um valor válido para o orçamento');
          return;
        }

        // Se o valor for 0,00, considerar como undefined (sem orçamento)
        if (isZeroValue || budget === 0) {
          budget = undefined;
        }
      }

      try {
        // Manter os mesmos itens da lista original
        updateList(selectedList.id, {
          ...selectedList,
          name: newListName.trim(),
          budget,
        });

        setNewListName('');
        setNewListBudget('');
        setFormattedBudget('R$ 0,00');
        setSelectedList(null);
        setEditModalVisible(false);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível atualizar a lista');
      }
    } else {
      Alert.alert('Erro', 'Por favor, digite um nome para a lista');
    }
  };

  // Excluir as listas selecionadas
  const handleDeleteSelected = () => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir ${selectedLists.size === 1 ? 'esta lista' : 'estas listas'}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              for (const listId of selectedLists) {
                await deleteList(listId);
              }
              // Sair do modo de seleção
              setSelectedLists(new Set());
              setSelectionMode(false);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir uma ou mais listas');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Renderizar a tela de carregamento
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const itemCount = item.items.length;
    const checkedCount = item.items.filter(i => i.checked).length;
    const progress = itemCount > 0 ? (checkedCount / itemCount) * 100 : 0;

    // Verificar se o total excede o orçamento (quando ambos estão definidos)
    const isOverBudget = item.budget !== undefined && item.total !== undefined && item.total > item.budget;

    // Verificar se este item está selecionado
    const isSelected = selectedLists.has(item.id);

    // Calcular o total baseado nos itens da lista, caso não exista
    const total = item.total !== undefined ? item.total :
                 item.items.reduce((sum, i) => sum + ((i.price || 0) * i.quantity), 0);

    // Formatar o total como moeda
    const formattedTotal = `R$ ${total.toFixed(2).replace('.', ',')}`;

    return (
      <Card
        onPress={() => {
          if (selectionMode) {
            toggleListSelection(item.id);
          } else {
            // Navegar para a tela de detalhes quando não estiver no modo de seleção
            navigation.navigate('ShoppingListDetails', { listId: item.id });
          }
        }}
        style={isSelected ? styles.selectedCard : undefined}
      >
        <View style={styles.listItemContainer}>
          {/* Indicador de seleção sempre visível e posicionado à esquerda */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={() => toggleListSelection(item.id)}
            />
          </View>

          <View style={styles.listItemHeader}>
            <Text style={styles.listTitle}>{item.name}</Text>
            <Text style={styles.listDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <View style={styles.listItemFooter}>
            <View style={styles.countBudgetContainer}>
              <Text style={styles.itemCount}>
                {checkedCount}/{itemCount} itens
              </Text>
              {item.budget !== undefined && (
                <Text style={styles.budgetText}>
                  Orçamento: R$ {item.budget.toFixed(2).replace('.', ',')}
                </Text>
              )}
            </View>
            <Text style={[styles.listTotal, isOverBudget && styles.overBudget]}>
              Total: {formattedTotal}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Tentar Novamente"
          onPress={() => {/* Reload data */}}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {selectionMode
            ? `${selectedLists.size} selecionada${selectedLists.size !== 1 ? 's' : ''}`
            : 'Minhas Listas'}
        </Text>
        {selectionMode && (
          <TouchableOpacity
            onPress={cancelSelectionMode}
            style={styles.cancelSelectionButton}
          >
            <Text style={styles.cancelSelectionText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      {lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Você ainda não tem listas de compras
          </Text>
          <Text style={styles.emptySubtext}>
            Toque no botão abaixo para criar sua primeira lista
          </Text>
          <Button
            title="Criar Nova Lista"
            onPress={handleCreateList}
            style={styles.createButton}
          />
        </View>
      ) : (
        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={isRefreshing}
          onRefresh={async () => {
            setIsRefreshing(true);
            try {
              await refreshLists();
            } finally {
              setIsRefreshing(false);
            }
          }}
        />
      )}

      {selectionMode ? (
        <View style={styles.actionBarContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              selectedLists.size !== 1 && styles.actionButtonDisabled,
            ]}
            onPress={handleEditSelected}
            disabled={selectedLists.size !== 1}
          >
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeleteSelected}
          >
            <Text style={styles.actionButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        lists.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateList}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )
      )}

      {/* Modal para entrada do nome da lista e orçamento */}
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
            <Text style={styles.modalTitle}>Nova Lista de Compras</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da lista"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Orçamento"
              value={formattedBudget}
              onChangeText={handleBudgetChange}
              keyboardType="numeric"
              caretHidden={true}
              selectTextOnFocus={false}
              onFocus={() => {
                // Não fazer nada especial ao focar, manter o valor atual
              }}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setNewListName('');
                  setNewListBudget('');
                  setFormattedBudget('');
                  setModalVisible(false);
                }}
                type="outline"
              />
              <Button
                title="Criar"
                onPress={confirmCreateList}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal para editar uma lista existente */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Lista de Compras</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da lista"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Orçamento"
              value={formattedBudget}
              onChangeText={handleBudgetChange}
              keyboardType="numeric"
              caretHidden={true}
              selectTextOnFocus={false}
              onFocus={() => {
                // Não fazer nada especial ao focar, manter o valor atual
              }}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setSelectedList(null);
                  setNewListName('');
                  setNewListBudget('');
                  setFormattedBudget('R$ 0,00');
                  setEditModalVisible(false);
                }}
                type="outline"
              />
              <Button
                title="Salvar"
                onPress={confirmEditList}
              />
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
  header: {
    padding: METRICS.sectionPadding,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: METRICS.fontSizeHeader,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: METRICS.sectionPadding,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: METRICS.baseMargin,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: METRICS.fontSizeLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: METRICS.baseMargin,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.textSecondary,
    marginBottom: METRICS.doubleBaseMargin,
    textAlign: 'center',
  },
  createButton: {
    width: 200,
  },
  listContainer: {
    padding: METRICS.baseMargin,
  },
  listItemContainer: {
    paddingVertical: METRICS.smallMargin,
    paddingLeft: 65,
    position: 'relative',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: METRICS.baseMargin,
  },
  listTitle: {
    fontSize: METRICS.fontSizeMedium,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listDate: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.textSecondary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: METRICS.baseMargin,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  listItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.textSecondary,
  },
  listTotal: {
    fontSize: METRICS.fontSizeSmall,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: METRICS.baseMargin,
  },
  retryButton: {
    width: 180,
  },
  addButton: {
    position: 'absolute',
    bottom: METRICS.doubleBaseMargin,
    right: METRICS.doubleBaseMargin,
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
  addButtonText: {
    fontSize: 24,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  // Estilos do modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.background,
    borderRadius: METRICS.borderRadius,
    padding: METRICS.sectionPadding,
    alignItems: 'center',
    elevation: 12,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: METRICS.fontSizeMedium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: METRICS.smallMargin,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    borderRadius: METRICS.borderRadius,
    paddingHorizontal: METRICS.baseMargin,
    fontSize: METRICS.fontSizeMedium,
    color: COLORS.text,
    marginBottom: METRICS.doubleBaseMargin,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: METRICS.baseMargin,
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.text,
  },
  countBudgetContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  budgetText: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  overBudget: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  actionBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    height: 60,
    paddingHorizontal: METRICS.baseMargin,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: METRICS.baseMargin,
    margin: METRICS.baseMargin,
    borderRadius: METRICS.borderRadius,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  actionButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  cancelSelectionButton: {
    padding: METRICS.baseMargin,
  },
  cancelSelectionText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  checkboxContainer: {
    position: 'absolute',
    left: 15,
    top: '50%',
    transform: [{ translateY: -15 }],
    zIndex: 1,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderWidth: 2.5,
    borderColor: COLORS.textLight,
    borderRadius: 8,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
