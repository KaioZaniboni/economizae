import {Platform} from 'react-native';

// Definição de fontes para o aplicativo
export const FONTS = {
  // Principais famílias de fontes
  primary: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System-Medium',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System-Bold',
    }),
    light: Platform.select({
      ios: 'System',
      android: 'Roboto-Light',
      default: 'System-Light',
    }),
  },

  // Fontes secundárias
  secondary: {
    regular: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'System-Medium',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'sans-serif-bold',
      default: 'System-Bold',
    }),
  },

  // Fontes monospace (para código, logs, etc.)
  mono: {
    regular: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
};

// Configurações de estilo de texto
export const TEXT_STYLES = {
  header: {
    fontFamily: FONTS.primary.bold,
    fontSize: 20,
  },
  title: {
    fontFamily: FONTS.primary.bold,
    fontSize: 18,
  },
  subtitle: {
    fontFamily: FONTS.primary.medium,
    fontSize: 16,
  },
  body: {
    fontFamily: FONTS.primary.regular,
    fontSize: 14,
  },
  caption: {
    fontFamily: FONTS.primary.light,
    fontSize: 12,
  },
  button: {
    fontFamily: FONTS.primary.medium,
    fontSize: 16,
  },
  code: {
    fontFamily: FONTS.mono.regular,
    fontSize: 14,
  },
};
