import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useShoppingList } from '../hooks';
import { COLORS, METRICS } from '../constants';
import { Card, Button } from '../components/common';
import { logDebug, simulateDelay } from '../utils/debug';

const TAG = 'DebugScreen';

export const DebugScreen: React.FC = () => {
  const [isHermesEnabled, setIsHermesEnabled] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { lists, createList, addItem } = useShoppingList();
  
  useEffect(() => {
    checkHermesStatus();
    collectDeviceInfo();
  }, []);

  const checkHermesStatus = () => {
    // @ts-ignore - Verificando se Hermes está habilitado
    const hermesEnabled = !!global.HermesInternal;
    setIsHermesEnabled(hermesEnabled);
    logDebug(TAG, `Hermes está ${hermesEnabled ? 'ativado' : 'desativado'}`);
  };

  const collectDeviceInfo = () => {
    const info = [
      `Platform: ${Platform.OS}`,
      `Version: ${Platform.Version}`,
      `is Debug: ${__DEV__ ? 'Yes' : 'No'}`,
    ].join('\n');
    
    setDeviceInfo(info);
    logDebug(TAG, info);
  };

  const handleSimulateNetworkDelay = async () => {
    setIsLoading(true);
    logDebug(TAG, 'Simulando atraso de rede...');
    
    try {
      await simulateDelay(2000);
      logDebug(TAG, 'Simulação de atraso concluída');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateListCreation = async () => {
    const timestamp = new Date().toISOString();
    await createList(`Lista de teste ${timestamp}`);
  };

  const handleSimulateItemAddition = async () => {
    if (lists.length === 0) {
      logDebug(TAG, 'Nenhuma lista disponível para adicionar item');
      return;
    }

    const listId = lists[0].id;
    await addItem(listId, {
      name: `Item teste ${new Date().toISOString()}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      unit: 'un',
      price: parseFloat((Math.random() * 50).toFixed(2)),
      category: 'Teste',
    });
  };

  const handleThrowError = () => {
    throw new Error('Erro simulado para teste de depuração');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ferramentas de Depuração</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Informações do Ambiente</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Modo:</Text>
          <Text style={styles.infoValue}>{__DEV__ ? 'Desenvolvimento' : 'Produção'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hermes:</Text>
          <View style={styles.statusContainer}>
            <Text style={styles.infoValue}>
              {isHermesEnabled ? 'Ativado' : 'Desativado'}
            </Text>
            <View 
              style={[
                styles.statusIndicator, 
                { backgroundColor: isHermesEnabled ? COLORS.success : COLORS.error }
              ]} 
            />
          </View>
        </View>
        
        <Text style={styles.infoLabel}>Dispositivo:</Text>
        <Text style={styles.deviceInfo}>{deviceInfo}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Simulações para Teste</Text>
        
        <Button
          title="Simular Atraso de Rede (2s)"
          onPress={handleSimulateNetworkDelay}
          loading={isLoading}
          style={styles.button}
        />
        
        <Button
          title="Criar Lista de Teste"
          onPress={handleSimulateListCreation}
          style={styles.button}
        />
        
        <Button
          title="Adicionar Item de Teste"
          onPress={handleSimulateItemAddition}
          style={styles.button}
        />
        
        <Button
          title="Simular Erro"
          onPress={handleThrowError}
          type="outline"
          style={styles.button}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Estado Atual</Text>
        <Text style={styles.infoLabel}>Listas:</Text>
        <Text style={styles.infoValue}>{lists.length} listas encontradas</Text>
        
        {lists.length > 0 && (
          <View style={styles.listsContainer}>
            {lists.map((list) => (
              <View key={list.id} style={styles.listItem}>
                <Text style={styles.listName}>{list.name}</Text>
                <Text style={styles.listItemCount}>{list.items.length} itens</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
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
  card: {
    marginHorizontal: METRICS.baseMargin,
    marginTop: METRICS.baseMargin,
  },
  sectionTitle: {
    fontSize: METRICS.fontSizeLarge,
    fontWeight: 'bold',
    marginBottom: METRICS.baseMargin,
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: METRICS.smallMargin,
  },
  infoLabel: {
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.textSecondary,
    marginBottom: METRICS.smallMargin,
  },
  infoValue: {
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.text,
    fontWeight: '500',
  },
  deviceInfo: {
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.text,
    backgroundColor: COLORS.backgroundDark,
    padding: METRICS.baseMargin,
    borderRadius: METRICS.borderRadius,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    marginBottom: METRICS.baseMargin,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: METRICS.smallMargin,
  },
  listsContainer: {
    marginTop: METRICS.baseMargin,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: METRICS.smallMargin,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textLight,
  },
  listName: {
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.text,
  },
  listItemCount: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.textSecondary,
  },
}); 