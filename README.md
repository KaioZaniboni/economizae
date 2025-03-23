This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

## Depuração do Projeto

### Ferramentas de Depuração Disponíveis

O projeto Economizae inclui várias ferramentas para facilitar a depuração:

#### 1. VSCode Debugging

Para depurar no VSCode:

1. Instale a extensão "React Native Tools"
2. Pressione F5 ou clique em "Run and Debug" no painel lateral
3. Selecione "Debug Android" ou "Debug iOS"
4. Coloque breakpoints diretamente no código clicando na margem esquerda

#### 2. Utilitários de Depuração

O projeto inclui utilitários de depuração em `src/utils/debug.ts`:

```typescript
// Exemplos de uso
import {logDebug, logError, logPerformance} from '../utils/debug';

// Log com tag para fácil identificação
logDebug('MeuComponente', 'Dados carregados');

// Log de objetos formatados
logDebug('MeuComponente', {id: 1, nome: 'Item'});

// Medição de performance
const resultado = await logPerformance('operacaoImportante', async () => {
  // Código que você quer medir
  return await minhaOperacaoAssincrona();
});
```

#### 3. Tela de Depuração

Em ambiente de desenvolvimento, uma tela especial "Debug" está disponível no menu de navegação inferior. Esta tela oferece:

- Informações do ambiente e dispositivo
- Simulações de operações comuns para teste
- Indicador visual de ativação do Hermes
- Visualização do estado atual da aplicação

#### 4. Chrome DevTools

Para depurar com Chrome DevTools:

1. Inicie o app no emulador ou dispositivo
2. Abra o menu de desenvolvedor (agite o dispositivo)
3. Selecione "Debug JS Remotely"
4. Use o console e ferramentas de depuração do Chrome

#### 5. React Native Debugger (Recomendado)

Para uma experiência mais completa:

1. Instale o [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
2. Execute o React Native Debugger antes de iniciar o app
3. Ative a depuração JS remota no aplicativo

### Boas Práticas de Depuração

1. Use os utilitários `logDebug` e `logError` em vez de `console.log` direto
2. Sempre identifique logs com tags consistentes
3. Remova logs desnecessários antes de commits finais
4. Use `logPerformance` para identificar gargalos em operações críticas
