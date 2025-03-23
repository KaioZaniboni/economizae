import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS, METRICS } from '../constants';
import { useShoppingList } from '../hooks';
import { Card, Button } from '../components/common';
import { ShoppingList } from '../types';

export const HomeScreen = () => {
  const { lists, loading, error, createList } = useShoppingList();

  const handleCreateList = () => {
    // Aqui seria exibido um diálogo para obter o nome da lista
    Alert.prompt(
      'Nova Lista',
      'Digite o nome da nova lista de compras',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Criar',
          onPress: (name) => {
            if (name && name.trim()) {
              createList(name.trim());
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const itemCount = item.items.length;
    const checkedCount = item.items.filter(i => i.checked).length;
    const progress = itemCount > 0 ? (checkedCount / itemCount) * 100 : 0;

    return (
      <Card onPress={() => {/* Navegar para a lista */}}>
        <View style={styles.listItemContainer}>
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
                { width: `${progress}%` }
              ]} 
            />
          </View>
          
          <View style={styles.listItemFooter}>
            <Text style={styles.itemCount}>
              {checkedCount}/{itemCount} itens
            </Text>
            <Text style={styles.listTotal}>
              Total: R$ {item.total?.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Carregando...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Minhas Listas</Text>
      </View>
      
      {lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Você ainda não possui listas de compras
          </Text>
          <Button
            title="Criar Lista"
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
        />
      )}
      
      {lists.length > 0 && (
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleCreateList}
        >
          <Text style={styles.fabButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
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
    padding: METRICS.sectionPadding,
  },
  emptyText: {
    fontSize: METRICS.fontSizeMedium,
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
  fabButton: {
    position: 'absolute',
    bottom: METRICS.doubleBaseMargin,
    right: METRICS.doubleBaseMargin,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabButtonText: {
    fontSize: 24,
    color: COLORS.background,
    fontWeight: 'bold',
  },
}); 