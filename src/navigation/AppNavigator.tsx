import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants';
import { HomeScreen } from '../screens/HomeScreen';
import { DebugScreen } from '../screens/DebugScreen';

// Tema de navegação para garantir que as cores sejam aplicadas corretamente
const navigationTheme = {
  dark: false,
  colors: {
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.background,
    text: COLORS.text,
    border: COLORS.textLight,
    notification: COLORS.error,
  },
};

// Vamos criar componentes de placeholder para as outras telas
const StatisticsScreen = () => (
  <View style={[styles.center, { backgroundColor: COLORS.background }]}>
    <Text style={{ color: COLORS.text }}>Estatísticas</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={[styles.center, { backgroundColor: COLORS.background }]}>
    <Text style={{ color: COLORS.text }}>Configurações</Text>
  </View>
);

// Os tipos para a navegação
export type RootStackParamList = {
  Main: undefined;
  ShoppingListDetails: { listId: string };
  NewItem: { listId: string };
  EditItem: { listId: string; itemId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Statistics: undefined;
  Settings: undefined;
  Debug?: undefined; // Opcional, apenas em dev
};

// Criando os navegadores
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Navegador de abas principal
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.textLight,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Listas',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIcon, { backgroundColor: color }]} />
          ),
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          title: 'Estatísticas',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIcon, { backgroundColor: color }]} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIcon, { backgroundColor: color }]} />
          ),
        }}
      />

      {/* Tela de depuração que só aparece em ambiente de desenvolvimento */}
      {__DEV__ && (
        <Tab.Screen
          name="Debug"
          component={DebugScreen}
          options={{
            title: 'Debug',
            tabBarIcon: ({ color }) => (
              <View style={[styles.tabIcon, { backgroundColor: color }]} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
};

// Navegador principal da aplicação
export const AppNavigator = () => {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.background,
          headerTitleStyle: {
            fontFamily: FONTS.primary.bold,
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        {/* Outras telas serão adicionadas posteriormente */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
