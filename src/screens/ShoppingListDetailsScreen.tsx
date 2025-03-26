import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  SectionList,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, METRICS } from '../constants';
import { useShoppingList, useSectionCollapse } from '../hooks';
import { Card, CollapsibleSection } from '../components/common';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Item, ShoppingList } from '../types';
import { logDebug, logError } from '../utils/debug';
import { withRetry } from '../utils/errorHandler';
import { useErrorNotification, useSuccessNotification } from '../contexts/NotificationContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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

// Modificar o componente HorizontalSelector para voltar os botões ao formato anterior
const HorizontalSelector = ({
  items,
  renderItem,
  style,
  showButtons = true,
}: {
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showButtons?: boolean;
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPosition = useRef(0);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    scrollPosition.current = contentOffset.x;
    setShowLeftButton(contentOffset.x > 10);
    setShowRightButton(contentOffset.x < contentSize.width - layoutMeasurement.width - 10);
  };

  const scrollLeft = () => {
    if (scrollViewRef.current) {
      const newPosition = Math.max(0, scrollPosition.current - 150);
      scrollViewRef.current.scrollTo({ x: newPosition, animated: true });
    }
  };

  const scrollRight = () => {
    if (scrollViewRef.current) {
      const newPosition = scrollPosition.current + 150;
      scrollViewRef.current.scrollTo({ x: newPosition, animated: true });
    }
  };

  return (
    <View style={[styles.selectorContainer, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {items.map((item) => renderItem(item))}
      </ScrollView>

      {showButtons && showLeftButton && (
        <TouchableOpacity
          style={styles.leftButton}
          onPress={scrollLeft}
          activeOpacity={0.7}
        >
          <Text style={styles.scrollIndicatorIcon}>◂</Text>
        </TouchableOpacity>
      )}

      {showButtons && showRightButton && (
        <TouchableOpacity
          style={styles.rightButton}
          onPress={scrollRight}
          activeOpacity={0.7}
        >
          <Text style={styles.scrollIndicatorIcon}>▸</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Tipos para o componente ListNotFoundScreen
type ListNotFoundScreenProps = {
  onRetry: () => void;
  onGoBack: () => void;
};

// Tela para quando a lista não for encontrada
const ListNotFoundScreen: React.FC<ListNotFoundScreenProps> = ({ onRetry, onGoBack }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Lista não encontrada</Text>
    <Text style={styles.errorText}>
      Não foi possível encontrar a lista solicitada. Isso pode ocorrer por um dos seguintes motivos:
    </Text>
    <View style={styles.errorBullets}>
      <Text style={styles.errorBullet}>• A lista pode ter sido excluída</Text>
      <Text style={styles.errorBullet}>• Houve um problema ao acessar o armazenamento</Text>
      <Text style={styles.errorBullet}>• O ID da lista pode estar incorreto</Text>
    </View>
    <View style={styles.errorActions}>
      <TouchableOpacity style={styles.errorButton} onPress={onRetry}>
        <Text style={styles.errorButtonText}>Tentar novamente</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.errorButton, styles.errorButtonSecondary]} onPress={onGoBack}>
        <Text style={styles.errorButtonSecondaryText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export const ShoppingListDetailsScreen = ({ route, navigation }: ShoppingListDetailsScreenProps) => {
  const { listId } = route.params;
  const { getListById, addItem, updateItem, deleteItem, updateList } = useShoppingList();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Estados para o novo item
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState('un');
  const [itemPrice, setItemPrice] = useState('');
  const [formattedPrice, setFormattedPrice] = useState('R$ 0,00');
  const [itemCategory, setItemCategory] = useState('outros');

  // Gerenciamento do estado de colapso de seções com persistência usando o hook personalizado
  const { collapsedSections, toggleSection, toggleAll } = useSectionCollapse(
    useMemo(() => {
      // Obter array de IDs de categorias para inicializar o estado de colapso
      return list?.items
        ? Array.from(new Set(list.items.map(item => item.category || 'Sem categoria')))
        : [];
    }, [list?.items]),
    false, // Inicialmente expandido
    `collapsedSections-list-${listId}` // Chave única para este list ID
  );

  // Log para verificar a persistência
  useEffect(() => {
    if (list?.items?.length) {
      logDebug('ShoppingListDetails',
        `Lista ${listId} carregada com ${list.items.length} itens. ` +
        `Estado persistido: ${Object.keys(collapsedSections).length} categorias. ` +
        `Categorias colapsadas: ${Object.entries(collapsedSections)
          .filter(([_, collapsed]) => collapsed)
          .map(([key]) => key)
          .join(', ') || 'nenhuma'}`
      );
    }
  }, [list?.items, collapsedSections, listId]);

  const showErrorNotification = useErrorNotification();
  const showSuccessNotification = useSuccessNotification();

  // Carregar a lista
  const loadList = useCallback(async () => {
    let retryCount = 0;

    const attemptLoad = async (): Promise<boolean> => {
      try {
        if (retryCount > 0) {
          logDebug(TAG, `Tentativa ${retryCount} de carregar a lista ${listId}`);
        }

        setIsLoading(true);
        setLoadFailed(false);

        // Usar a função de retry para carregar a lista com mais robustez
        const data = await withRetry(
          () => getListById(listId),
          2, // máximo de tentativas
          800, // tempo de espera entre tentativas
          TAG
        );

        if (data) {
          setList(data);
          setLoadFailed(false);
          logDebug(TAG, `Lista ${listId} carregada com sucesso: ${data.name} (${data.items.length} itens)`);

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
            try {
              await updateList(listId, {
                ...data,
                total: calculatedTotal,
              });
            } catch (updateError) {
              logError(TAG, `Erro ao atualizar total da lista: ${updateError}`);
              // Não interromper o fluxo por causa de um erro na atualização do total
            }
          }
          return true;
        } else {
          logError(TAG, `Lista ${listId} não encontrada após recuperação`);
          setLoadFailed(true);
          return false;
        }
      } catch (error) {
        logError(TAG, `Erro ao carregar lista ${listId}: ${error}`);
        setLoadFailed(true);
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    return attemptLoad();
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
  const formatCurrency = useCallback((value: string) => {
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
  }, []);

  // Função para validação da quantidade (aceita apenas números)
  const handleQuantityChange = (text: string) => {
    // Permite apenas dígitos
    const numericValue = text.replace(/[^0-9]/g, '');
    // Se ficar vazio, define como '1'
    const finalValue = numericValue === '' ? '1' : numericValue;
    setItemQuantity(finalValue);
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

  // Excluir um item
  const handleDeleteItem = useCallback((itemId: string) => {
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
              showSuccessNotification('Item excluído com sucesso');
            } catch (error) {
              showErrorNotification('Não foi possível excluir o item');
            }
          },
        },
      ]
    );
  }, [deleteItem, listId, loadList, showErrorNotification, showSuccessNotification]);

  // Alternar o estado de marcação do item
  const toggleItemCheck = useCallback(async (itemId: string, checked: boolean) => {
    try {
      await updateItem(listId, itemId, { checked: !checked });
      loadList();
    } catch (error) {
      showErrorNotification('Não foi possível atualizar o item');
    }
  }, [updateItem, listId, loadList, showErrorNotification]);

  // Abrir modal para editar um item existente
  const handleEditItem = useCallback((item: Item) => {
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
  }, [formatCurrency]);

  // Salvar o item (adicionar novo ou atualizar existente)
  const handleSaveItem = () => {
    if (!itemName.trim()) {
      showErrorNotification('O nome do item é obrigatório');
      return;
    }

    const quantity = parseInt(itemQuantity) || 1;
    if (quantity <= 0) {
      showErrorNotification('A quantidade deve ser maior que zero');
      return;
    }

    // Converter o preço para número
    let price: number | undefined;
    if (itemPrice) {
      price = parseFloat(itemPrice) / 100;
      if (isNaN(price)) {
        showErrorNotification('Por favor, digite um valor válido para o preço');
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
        showSuccessNotification(`Item "${itemName}" atualizado com sucesso`);
      } else {
        // Adicionar novo item
        addItem(listId, {
          name: itemName.trim(),
          quantity,
          unit: itemUnit,
          price,
          category: itemCategory,
        });
        showSuccessNotification(`Item "${itemName}" adicionado à lista`);
      }

      // Recarregar lista e fechar modal
      loadList();
      setModalVisible(false);
    } catch (error) {
      showErrorNotification(`Não foi possível ${editingItem ? 'atualizar' : 'adicionar'} o item`);
    }
  };

  // Função para agrupar itens por categoria com memoização
  const groupItemsByCategory = useCallback(() => {
    if (!list?.items?.length) {
      logDebug(TAG, 'Lista vazia ou não carregada, retornando array vazio');
      return [];
    }

    const startTime = Date.now();
    logDebug(TAG, `Agrupando ${list.items.length} itens por categoria`);

    const groupedItems: Record<string, Item[]> = {};

    // Inicializar grupos vazios para todas as categorias
    CATEGORIES.forEach(category => {
      groupedItems[category.id] = [];
    });

    // Adicionar cada item ao seu respectivo grupo
    list.items.forEach(item => {
      const category = item.category || 'outros';
      if (!groupedItems[category]) {
        groupedItems[category] = [];
      }
      groupedItems[category].push(item);
    });

    // Converter para array de seções
    const sections = CATEGORIES
      .filter(category => groupedItems[category.id]?.length > 0) // Remover categorias vazias
      .map(category => ({
        category,
        data: groupedItems[category.id],
      }));

    const endTime = Date.now();
    logDebug(TAG, `Agrupamento concluído em ${endTime - startTime}ms. ${sections.length} categorias com itens.`);

    return sections;
  }, [list?.items]);

  // Memoizar o resultado para evitar recálculos desnecessários
  const groupedSections = useMemo(() => {
    const sections = groupItemsByCategory();
    logDebug(TAG, `Seções agrupadas memoizadas: ${sections.length} categorias`);
    return sections;
  }, [groupItemsByCategory]);

  // Renderizar item da lista para o conteúdo da seção
  const renderItemForSection = useCallback(({ item }: { item: Item }) => {
    // Encontrar a categoria para obter a cor
    const category = CATEGORIES.find(cat => cat.id === (item.category || 'outros'));
    const categoryColor = category?.color || COLORS.textLight;

    return (
      <View style={styles.itemWrapper}>
        <Card style={[styles.itemCard, item.checked && styles.checkedItem]}>
          <TouchableOpacity
            style={styles.checkBox}
            onPress={() => toggleItemCheck(item.id, item.checked)}
          >
            <View
              style={[
                styles.checkBoxInner,
                item.checked && { backgroundColor: categoryColor },
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
      </View>
    );
  }, [handleDeleteItem, handleEditItem, toggleItemCheck]);

  // Renderizar cabeçalho de seção como um botão expansível
  const renderSectionHeader = useCallback(({ section }: { section: { category: typeof CATEGORIES[0], data: Item[] } }) => {
    const category = section.category;

    // Obter o estado de colapso da categoria atual
    const isCollapsed = Boolean(collapsedSections[category.id]);

    logDebug(TAG, `Renderizando seção ${category.name} (id: ${category.id}). Estado de colapso: ${isCollapsed}, ${section.data.length} itens`);

    // Função específica para lidar com o toggle desta categoria
    const handleToggle = () => {
      logDebug(TAG, `Toggle clicado para categoria ${category.name} (id: ${category.id}). Estado atual: ${isCollapsed}`);
      toggleSection(category.id);
    };

    // Retornamos apenas o header da seção como um CollapsibleSection simplificado
    return (
      <CollapsibleSection
        title={category.name}
        titleColor={category.color}
        backgroundColor={`${category.color}30`}
        count={section.data.length}
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
        contentContainerStyle={styles.sectionContent}
      >
        {/* Nós removemos a renderização de itens dentro do CollapsibleSection */}
        {/* Os itens serão renderizados diretamente pela SectionList */}
        <View style={{height: 1}} />
      </CollapsibleSection>
    );
  }, [collapsedSections, toggleSection]);

  // Conteúdo principal - modificado para considerar os estados de loading e falha
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Carregando lista...</Text>
        </View>
      );
    }

    if (loadFailed || !list) {
      return (
        <ListNotFoundScreen
          onRetry={() => loadList()}
          onGoBack={() => navigation.goBack()}
        />
      );
    }

    return (
      <View style={styles.container}>
        {/* Cabeçalho com orçamento e total */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.budgetContainer}>
              <Text style={styles.label}>Orçamento:</Text>
              <Text style={[
                styles.budgetText,
                isOverBudget() && styles.overBudget,
              ]}>
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

          {list.items.length > 0 && (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.headerButton, styles.expandButton]}
                onPress={() => {
                  logDebug(TAG, 'Botão "Expandir tudo" clicado');
                  toggleAll();
                }}
              >
                <Icon
                  name="expand-all"
                  type="material-community"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.headerButtonText}>Expandir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, styles.collapseButton]}
                onPress={() => {
                  logDebug(TAG, 'Botão "Recolher tudo" clicado');
                  toggleAll();
                }}
              >
                <Icon
                  name="collapse-all"
                  type="material-community"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.headerButtonText}>Recolher</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Lista de itens com otimização de performance */}
        {list.items.length > 0 ? (
          <SectionList
            sections={groupedSections}
            keyExtractor={(item) => item.id}
            renderItem={({item, section}) => {
              const categoryId = section.category.id;
              const isCollapsed = Boolean(collapsedSections[categoryId]);

              // Se a seção estiver colapsada, não renderizamos nada aqui
              if (isCollapsed) {
                return null;
              }

              // Renderizamos diretamente se não estiver colapsado
              return renderItemForSection({item});
            }}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={true}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={15}
            onEndReachedThreshold={0.5}
            updateCellsBatchingPeriod={50} // Ajustamos para resposta mais rápida
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum item na lista</Text>
            <Text style={styles.emptySubtext}>Toque no botão + para adicionar itens</Text>
          </View>
        )}

        {/* Botão para adicionar item */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddItem}
        >
          <Text style={styles.addButtonText}>+</Text>
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
                <View style={[styles.formGroup, { flex: 0.5, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Quantidade</Text>
                  <TextInput
                    style={styles.textInput}
                    value={itemQuantity}
                    onChangeText={handleQuantityChange}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1.5, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Unidade</Text>
                  <View style={styles.unitContainer}>
                    {UNITS.map((unit) => (
                      <TouchableOpacity
                        key={unit}
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
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.priceFormGroup}>
                <Text style={styles.formLabel}>Preço</Text>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={[styles.textInput, styles.priceInput]}
                    value={formattedPrice}
                    onChangeText={handlePriceChange}
                    keyboardType="numeric"
                    placeholder="R$ 0,00"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Categoria</Text>
                <HorizontalSelector
                  items={CATEGORIES}
                  style={styles.categorySelector}
                  renderItem={(category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryItem,
                        { backgroundColor: category.color + '30' }, // Cor com transparência
                        itemCategory === category.id && { borderColor: category.color, borderWidth: 2 },
                      ]}
                      onPress={() => setItemCategory(category.id)}
                    >
                      <Text style={styles.categoryText}>{category.name}</Text>
                    </TouchableOpacity>
                  )}
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

  return (
    <View style={styles.container}>
      {renderContent()}
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
    flexDirection: 'column',
    padding: METRICS.padding.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundDark,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
  addButton: {
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
  addButtonText: {
    fontSize: 24,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  itemCard: {
    flexDirection: 'row',
    padding: METRICS.padding.sm,
    borderRadius: METRICS.borderRadii.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
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
  priceFormGroup: {
    marginBottom: METRICS.margin.md,
    marginTop: -8,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: METRICS.margin.md,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
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
  unitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: METRICS.borderRadii.md,
    padding: 6,
  },
  unitItem: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: METRICS.borderRadii.md,
    flex: 1,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
  },
  unitText: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
  },
  categorySelector: {
    width: '100%',
  },
  categoryItem: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: METRICS.borderRadii.md,
    marginRight: 3,
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
  selectorContainer: {
    position: 'relative',
    width: '100%',
    borderRadius: METRICS.borderRadii.md,
    minHeight: 40,
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingLeft: 35,
    paddingRight: 35,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderTopLeftRadius: METRICS.borderRadii.md,
    borderBottomLeftRadius: METRICS.borderRadii.md,
  },
  rightButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderTopRightRadius: METRICS.borderRadii.md,
    borderBottomRightRadius: METRICS.borderRadii.md,
  },
  scrollIndicatorIcon: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  leftFade: {
    display: 'none', // Remover fade para evitar sobreposição
  },
  rightFade: {
    display: 'none', // Remover fade para evitar sobreposição
  },
  priceInputContainer: {
    width: '50%',
  },
  priceInput: {
    padding: METRICS.padding.sm,
  },
  budgetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addBudgetButton: {
    padding: METRICS.padding.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: METRICS.borderRadii.sm,
  },
  addBudgetButtonText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sectionSeparator: {
    height: 8,
  },
  sectionContent: {
    paddingHorizontal: METRICS.padding.sm,
    marginBottom: METRICS.margin.md,
  },
  itemWrapper: {
    marginVertical: METRICS.margin.xs,
  },
  listContent: {
    padding: METRICS.padding.md,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.backgroundLight,
  },
  headerButton: {
    padding: METRICS.padding.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    borderRadius: METRICS.borderRadii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  expandButton: {
    marginRight: 4,
  },
  collapseButton: {},
  errorContainer: {
    flex: 1,
    padding: METRICS.padding.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorBullets: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  errorBullet: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
    paddingLeft: 8,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  errorButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: METRICS.borderRadii.md,
    marginHorizontal: 8,
  },
  errorButtonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorButtonSecondary: {
    backgroundColor: COLORS.backgroundLight,
  },
  errorButtonSecondaryText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
