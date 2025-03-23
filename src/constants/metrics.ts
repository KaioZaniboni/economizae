import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const METRICS = {
  // Dimensões da tela
  screenWidth: width,
  screenHeight: height,
  
  // Paddings e Margins
  baseMargin: 10,
  doubleBaseMargin: 20,
  smallMargin: 5,
  
  // Padding de seção
  sectionPadding: 20,
  
  // Border Radius
  borderRadius: 8,
  buttonBorderRadius: 24,
  
  // Tamanho de ícones
  iconSize: 24,
  iconSizeSmall: 16,
  iconSizeLarge: 32,
  
  // Altura de componentes
  inputHeight: 48,
  buttonHeight: 48,
  headerHeight: Platform.OS === 'ios' ? 64 : 56,
  tabBarHeight: Platform.OS === 'ios' ? 80 : 64,
  
  // Tamanho de fonte
  fontSizeSmall: 12,
  fontSizeRegular: 14,
  fontSizeMedium: 16,
  fontSizeLarge: 18,
  fontSizeExtraLarge: 24,
  fontSizeHeader: 20,
  
  // Espaçamento de linha
  lineHeightSmall: 16,
  lineHeightRegular: 20,
  lineHeightLarge: 24,
  
  // Opacidade
  activeOpacity: 0.7,
}; 