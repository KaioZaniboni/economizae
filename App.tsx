/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, SafeAreaView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { AppNavigator } from './src/navigation';
import { COLORS } from './src/constants';
import { LogProvider } from './src/contexts/LogContext';
import LogMonitor from './src/components/LogMonitor';
import DebugComponent from './src/components/DebugComponent';

// Criando um objeto global para controlar a visibilidade dos botões
export const DebugControls = {
  showButtons: false,
  showDebugComponent: false, // Controle para o componente de depuração também desabilitado por padrão
  setShowButtons: (value: boolean) => {
    DebugControls.showButtons = value;
    // Notificar subscribers
    DebugControls.subscribers.forEach(callback => callback(value));
  },
  setShowDebugComponent: (value: boolean) => {
    DebugControls.showDebugComponent = value;
    // Notificar subscribers
    DebugControls.debugComponentSubscribers.forEach(callback => callback(value));
  },
  subscribers: [] as ((value: boolean) => void)[],
  debugComponentSubscribers: [] as ((value: boolean) => void)[],
  subscribe: (callback: (value: boolean) => void) => {
    DebugControls.subscribers.push(callback);
    return () => {
      const index = DebugControls.subscribers.indexOf(callback);
      if (index > -1) {
        DebugControls.subscribers.splice(index, 1);
      }
    };
  },
  subscribeDebugComponent: (callback: (value: boolean) => void) => {
    DebugControls.debugComponentSubscribers.push(callback);
    return () => {
      const index = DebugControls.debugComponentSubscribers.indexOf(callback);
      if (index > -1) {
        DebugControls.debugComponentSubscribers.splice(index, 1);
      }
    };
  },
};

const App = () => {
  const [logMonitorVisible, setLogMonitorVisible] = useState(false);
  const [showDebug, setShowDebug] = useState(false); // Iniciar como false para ocultar o componente de debug
  const [showButtons, setShowButtons] = useState(false); // Estado para controlar a visibilidade dos botões

  // Sincronizar o estado local com o controle global
  useEffect(() => {
    const unsubscribeButtons = DebugControls.subscribe((value) => {
      setShowButtons(value);
    });
    const unsubscribeDebug = DebugControls.subscribeDebugComponent((value) => {
      setShowDebug(value);
    });
    return () => {
      unsubscribeButtons();
      unsubscribeDebug();
    };
  }, []);

  const toggleLogMonitor = () => {
    setLogMonitorVisible(!logMonitorVisible);
  };

  const toggleDebugComponent = () => {
    const newValue = !showDebug;
    setShowDebug(newValue);
    DebugControls.setShowDebugComponent(newValue);
  };

  return (
    <View style={styles.rootContainer}>
      <LogProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar
            backgroundColor={COLORS.primary}
            barStyle="light-content"
          />
          <AppNavigator />

          {/* Componente de debug para verificar problemas de renderização */}
          {showDebug && <DebugComponent />}

          {/* Botões que só aparecem quando showButtons é true */}
          {showButtons && (
            <>
              {/* Botão flutuante para abrir o monitor de logs */}
              <TouchableOpacity
                style={styles.logButton}
                onPress={toggleLogMonitor}
              >
                <Text style={styles.logButtonText}>LOGS</Text>
              </TouchableOpacity>

              {/* Botão para alternar o componente de debug */}
              <TouchableOpacity
                style={[styles.logButton, styles.debugButton]}
                onPress={toggleDebugComponent}
              >
                <Text style={styles.logButtonText}>DEBUG</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Monitor de logs */}
          <LogMonitor
            visible={logMonitorVisible}
            onClose={() => setLogMonitorVisible(false)}
          />
        </SafeAreaView>
      </LogProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  logButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  debugButton: {
    right: 100, // Posicionar à esquerda do botão de logs
    backgroundColor: COLORS.accent,
  },
  logButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default App;
