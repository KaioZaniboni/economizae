import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList, TextInput } from 'react-native';
import { Card } from './common/Card';
import { Input } from './common/Input';
import VoiceButton from './common/VoiceButton';
import { COLORS, METRICS, TEXT_STYLES } from '../constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ParsedItem } from '../services/witai';
import { Item } from '../types';

interface ShoppingListCardProps {
  title: string;
  onItemAdded?: (item: Omit<Item, 'id' | 'checked' | 'createdAt' | 'updatedAt'>) => void;
}

const ShoppingListCard: React.FC<ShoppingListCardProps> = ({
  title,
  onItemAdded,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1'); // Estado para a quantidade como string

  // Função para validar se é um número
  const handleQuantityChange = (text: string) => {
    // Permite apenas dígitos
    const numericValue = text.replace(/[^0-9]/g, '');
    // Se ficar vazio, define como '1'
    const finalValue = numericValue === '' ? '1' : numericValue;
    setNewItemQuantity(finalValue);
  };

  // Função para adicionar um item manualmente
  const handleAddItem = () => {
    if (newItemText.trim()) {
      // Converte para número e garante valor mínimo de 1
      const quantity = parseInt(newItemQuantity, 10) || 1;

      const newItem: Item = {
        id: Date.now().toString(),
        name: newItemText.trim(),
        quantity,
        unit: 'un',
        checked: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setItems(prev => [...prev, newItem]);
      setNewItemText('');
      setNewItemQuantity('1'); // Resetar a quantidade para o valor padrão

      if (onItemAdded) {
        // Omitir os campos que são adicionados ao integrar com a lista
        const { id, checked, createdAt, updatedAt, ...itemData } = newItem;
        onItemAdded(itemData);
      }
    }
  };

  // Função para lidar com os itens reconhecidos pela voz
  const handleVoiceItems = (parsedItems: ParsedItem[]) => {
    if (parsedItems.length > 0) {
      const timestamp = Date.now();

      const newItems: Item[] = parsedItems.map(item => ({
        id: timestamp + Math.random().toString(36).substring(2),
        name: item.produto,
        quantity: item.quantidade,
        unit: item.unidade || 'un',
        checked: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      }));

      setItems(prev => [...prev, ...newItems]);

      // Notificar itens adicionados
      if (onItemAdded) {
        newItems.forEach(item => {
          // Omitir os campos que são adicionados ao integrar com a lista
          const { id, checked, createdAt, updatedAt, ...itemData } = item;
          onItemAdded(itemData);
        });
      }
    }
  };

  // Renderiza cada item da lista
  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemQuantity}>
          {item.quantity}
          {item.unit ? ` ${item.unit}` : ''}
        </Text>
        <Text style={styles.itemName}>{item.name}</Text>
      </View>
    </View>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum item adicionado. Use a entrada de texto ou voz para adicionar itens.
          </Text>
        }
      />

      <View style={styles.inputContainer}>
        {/* Campo para quantidade */}
        <View style={styles.quantityInputContainer}>
          <Text style={styles.quantityLabel}>Qtd:</Text>
          <TextInput
            style={styles.quantityInput}
            value={newItemQuantity}
            onChangeText={handleQuantityChange}
            keyboardType="numeric"
            maxLength={3} // Limita a 3 dígitos
            returnKeyType="done"
          />
        </View>

        {/* Campo para nome do produto */}
        <Input
          placeholder="Digite um novo item..."
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
          style={styles.input}
          rightIcon={
            <Icon
              name="plus-circle"
              size={24}
              color={COLORS.primary}
              onPress={handleAddItem}
            />
          }
        />
      </View>

      <View style={styles.voiceButtonContainer}>
        <VoiceButton
          onItemsRecognized={handleVoiceItems}
          label="Adicionar itens por voz"
          size={50}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: METRICS.baseMargin,
    marginVertical: METRICS.baseMargin,
    padding: METRICS.baseMargin,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: METRICS.baseMargin,
  },
  title: {
    fontSize: METRICS.fontSizeLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: TEXT_STYLES.title.fontFamily,
  },
  list: {
    maxHeight: 200,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: METRICS.smallMargin,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.backgroundDark,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemQuantity: {
    fontSize: METRICS.fontSizeRegular,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: METRICS.smallMargin,
    minWidth: 30,
  },
  itemName: {
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.text,
    flex: 1,
  },
  emptyText: {
    color: COLORS.textLight,
    textAlign: 'center',
    padding: METRICS.baseMargin,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginTop: METRICS.baseMargin,
  },
  input: {
    flex: 1,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: METRICS.smallMargin,
  },
  quantityLabel: {
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.text,
    marginRight: METRICS.smallMargin,
    fontWeight: 'bold',
  },
  quantityInput: {
    width: 50,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.textLight,
    borderRadius: METRICS.borderRadius,
    paddingHorizontal: METRICS.smallMargin,
    textAlign: 'center',
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  voiceButtonContainer: {
    alignItems: 'center',
    marginTop: METRICS.baseMargin,
    paddingTop: METRICS.smallMargin,
    borderTopWidth: 1,
    borderTopColor: COLORS.backgroundDark,
  },
});

export default ShoppingListCard;
