import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { useShoppingList } from '../hooks';
import { COLORS, METRICS } from '../constants';
import { Card, Button } from '../components/common';
import { logDebug, simulateDelay } from '../utils/debug';
import ExampleComponent from '../components/ExampleComponent';
import { useLogs } from '../contexts/LogContext';
import useLogNavigation from '../hooks/useLogNavigation';
import { DebugControls } from '../../App';

const TAG = 'DebugScreen';

// @ts-ignore
export const DebugScreen: React.FC = () => {
  const [isHermesEnabled, setIsHermesEnabled] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { lists, createList, addItem } = useShoppingList();
  const { logInteraction } = useLogs();
  const [showButtons, setShowButtons] = useState<boolean>(DebugControls.showButtons);
  const [showDebugComponent, setShowDebugComponent] = useState<boolean>(DebugControls.showDebugComponent);

  // Adiciona rastreamento de navegação
  useLogNavigation();

  useEffect(() => {
    checkHermesStatus();
    collectDeviceInfo();

    // Log de tela carregada
    logInteraction('DebugScreen', 'screen_loaded');
  }, [logInteraction]);

  const checkHermesStatus = () => {
    // @ts-ignore - Verificando se Hermes está habilitado
    const hermesEnabled = !!global.HermesInternal;
    setIsHermesEnabled(hermesEnabled);
    logDebug(TAG, `Hermes está ${hermesEnabled ? 'ativado' : 'desativado'}`);
  };

  const collectDeviceInfo = () => {
    const info = `
      Sistema: ${Platform.OS}
      Versão: ${Platform.Version}
      Versão RN: ${require('react-native/package.json').version}
    `;
    setDeviceInfo(info);
    logDebug(TAG, 'Informações do dispositivo coletadas');
  };

  const handleSimulateNetworkDelay = async () => {
    setIsLoading(true);
    logInteraction('DebugScreen', 'simulate_network_delay', { duration: 2000 });

    try {
      await simulateDelay(2000);
      logDebug(TAG, 'Delay de rede simulado com sucesso');
    } catch (error) {
      if (error instanceof Error) {
        logDebug(TAG, `Erro ao simular delay: ${error.message}`);
      } else {
        logDebug(TAG, 'Erro ao simular delay');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateListCreation = async () => {
    logInteraction('DebugScreen', 'simulate_list_creation');
    await createList(`Lista de teste ${Date.now()}`);
  };

  const handleSimulateItemAddition = async () => {
    if (lists.length === 0) {
      logDebug(TAG, 'Nenhuma lista disponível para adicionar itens');
      return;
    }

    const listId = lists[0].id;
    logInteraction('DebugScreen', 'simulate_item_addition', { listId });

    await addItem(listId, {
      name: `Item ${Date.now()}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      unit: 'un',
      price: parseFloat((Math.random() * 100).toFixed(2)),
      category: 'Teste',
    });
  };

  const handleThrowError = () => {
    logInteraction('DebugScreen', 'simulate_error');
    throw new Error('Erro simulado para teste!');
  };

  const handleToggleButtons = (value: boolean) => {
    setShowButtons(value);
    DebugControls.setShowButtons(value);
    logInteraction('DebugScreen', 'toggle_debug_buttons', { visible: value });
  };

  const handleToggleDebugComponent = (value: boolean) => {
    setShowDebugComponent(value);
    DebugControls.setShowDebugComponent(value);
    logInteraction('DebugScreen', 'toggle_debug_component', { visible: value });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tela de Depuração</Text>

      {/* Controle de visibilidade dos botões Debug/Logs */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Controle de Interface</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Mostrar botões DEBUG/LOGS:</Text>
          <Switch
            value={showButtons}
            onValueChange={handleToggleButtons}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={showButtons ? COLORS.accent : '#f4f3f4'}
          />
        </View>
        <Text style={styles.helpText}>
          Quando desativado, os botões flutuantes DEBUG e LOGS ficarão escondidos para melhor visualização das telas
        </Text>

        <View style={[styles.toggleRow, styles.toggleSeparator]}>
          <Text style={styles.label}>Mostrar componente de depuração:</Text>
          <Switch
            value={showDebugComponent}
            onValueChange={handleToggleDebugComponent}
            trackColor={{ false: '#767577', true: COLORS.primary }}
            thumbColor={showDebugComponent ? COLORS.accent : '#f4f3f4'}
          />
        </View>
        <Text style={styles.helpText}>
          Quando ativado, exibe o card de depuração nas telas para confirmar que a renderização está funcionando
        </Text>
      </Card>

      {/* Componente de exemplo com logs */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Componente com Logs</Text>
        {/* @ts-ignore - Componente de exemplo */}
        <ExampleComponent />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Informações do Ambiente</Text>
        <Text style={styles.label}>Hermes Engine:</Text>
        <Text style={styles.value}>
          {isHermesEnabled ? 'Ativado ✓' : 'Desativado ✗'}
        </Text>

        <Text style={styles.label}>Dispositivo:</Text>
        <Text style={styles.value}>{deviceInfo}</Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Testes de Performance</Text>
        <Button
          title="Simular Delay de Rede (2s)"
          onPress={handleSimulateNetworkDelay}
          loading={isLoading}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Operações de Dados</Text>
        <Button
          title="Criar Lista de Compras"
          onPress={handleSimulateListCreation}
          style={styles.button}
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Adicionar Item na Primeira Lista"
          onPress={handleSimulateItemAddition}
          disabled={lists.length === 0}
          style={styles.button}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Testes de Erro</Text>
        <Button
          title="Lançar Erro Não Tratado"
          onPress={handleThrowError}
          type="outline"
          style={styles.button}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: METRICS.fontSizeLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    margin: METRICS.doubleBaseMargin,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: METRICS.baseMargin,
    marginVertical: METRICS.smallMargin,
  },
  sectionTitle: {
    fontSize: METRICS.fontSizeMedium,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: METRICS.baseMargin,
  },
  label: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.textSecondary,
    marginBottom: METRICS.smallMargin,
  },
  value: {
    fontSize: METRICS.fontSizeRegular,
    color: COLORS.text,
    marginBottom: METRICS.baseMargin,
  },
  buttonSpacer: {
    height: METRICS.baseMargin,
  },
  button: {
    marginBottom: METRICS.baseMargin,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: METRICS.smallMargin,
  },
  helpText: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: METRICS.smallMargin,
  },
  toggleSeparator: {
    marginTop: METRICS.baseMargin,
    paddingTop: METRICS.baseMargin,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.textSecondary,
  },
});
