/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, SafeAreaView } from 'react-native';
import { AppNavigator } from './src/navigation';
import { COLORS } from './src/constants';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={COLORS.primary}
        barStyle="light-content"
      />
      <AppNavigator />
    </SafeAreaView>
  );
};

export default App;
