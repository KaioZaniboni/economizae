import React, {useState, useCallback, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Alert, Platform} from 'react-native';
import {Text, Button, Divider, Switch} from 'react-native-elements';
import {
  checkAsyncStorageConnection,
  clearAllCollapsedSectionsData,
  inspectCollapsedSectionsData,
} from '../utils/storage';
import {usePreferences} from '../hooks/usePreferences';
import {logDebug} from '../utils/debug';

const TAG = 'SettingsScreen';

export default function SettingsScreen() {
  const {
    darkMode,
    toggleDarkMode,
    notificationsEnabled,
    toggleNotifications,
    updatePreference,
    clearAllData,
  } = usePreferences();

  const [isDev, setIsDev] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleVersionClick = useCallback(() => {
    setClickCount(prevCount => {
      const newCount = prevCount + 1;
      if (newCount >= 7) {
        setIsDev(true);
        Alert.alert('Modo desenvolvedor', 'Você ativou o modo desenvolvedor!');
        return 0;
      }
      return newCount;
    });
  }, []);

  const resetApp = useCallback(() => {
    Alert.alert(
      'Redefinir aplicativo',
      'Isso excluirá todos os dados e redefinirá o aplicativo para seu estado inicial. Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert(
                'Sucesso',
                'Todos os dados foram excluídos. Reinicie o aplicativo.',
              );
            } catch (error) {
              Alert.alert(
                'Erro',
                'Ocorreu um erro ao tentar excluir os dados. Tente novamente.',
              );
            }
          },
        },
      ],
    );
  }, [clearAllData]);

  // Verificar conexão com AsyncStorage quando a tela for carregada
  useEffect(() => {
    const verifyStorage = async () => {
      const isConnected = await checkAsyncStorageConnection();
      logDebug(
        TAG,
        `Conexão com AsyncStorage: ${isConnected ? 'OK' : 'Falha'}`,
      );
    };
    verifyStorage();
  }, []);

  // Inspecionar dados de categorias colapsadas
  const inspectData = useCallback(async () => {
    await inspectCollapsedSectionsData();
    Alert.alert('Verificação Concluída', 'Verifique os logs para detalhes.');
  }, []);

  // Limpar todos os dados de categorias colapsadas
  const clearCategoriesData = useCallback(async () => {
    Alert.alert(
      'Limpar Dados de Categorias',
      'Isso excluirá toda a persistência do estado de colapso das categorias em todas as listas. Confirma?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllCollapsedSectionsData();
            Alert.alert(
              success ? 'Sucesso' : 'Erro',
              success
                ? 'Todos os dados de persistência de categorias foram excluídos.'
                : 'Ocorreu um erro ao tentar excluir os dados.',
            );
          },
        },
      ],
    );
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aparência</Text>
        <View style={styles.preference}>
          <Text>Modo escuro</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        <View style={styles.preference}>
          <Text>Ativar notificações</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </View>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados</Text>
        <Button
          title="Redefinir aplicativo"
          type="outline"
          buttonStyle={styles.resetButton}
          titleStyle={styles.resetButtonText}
          onPress={resetApp}
        />
        <Text style={styles.disclaimer}>
          Isso excluirá todos os dados locais do aplicativo, incluindo todas as
          suas listas de compras e configurações.
        </Text>
      </View>

      <Divider style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <Text style={styles.infoText}>Economizae</Text>
        <Text style={styles.versionText} onPress={handleVersionClick}>
          Versão 1.0.0
        </Text>
        <Text style={styles.disclaimer}>
          Desenvolvido para ajudar você a economizar nas suas compras diárias.
        </Text>
      </View>

      {isDev && (
        <>
          <Divider style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desenvolvimento</Text>
            <Button
              title="Verificar Dados de Categorias"
              type="outline"
              buttonStyle={styles.devButton}
              titleStyle={styles.devButtonText}
              onPress={inspectData}
            />
            <Button
              title="Limpar Dados de Categorias"
              type="outline"
              buttonStyle={[styles.devButton, styles.dangerButton]}
              titleStyle={styles.devButtonText}
              onPress={clearCategoriesData}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    height: 50,
    paddingHorizontal: 8,
  },
  divider: {
    marginVertical: 12,
  },
  resetButton: {
    borderColor: '#ff6b6b',
    marginVertical: 10,
  },
  resetButtonText: {
    color: '#ff6b6b',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  devButton: {
    marginVertical: 5,
    borderColor: '#3498db',
  },
  dangerButton: {
    borderColor: '#ff6b6b',
  },
  devButtonText: {
    color: '#3498db',
  },
});
