import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { COLORS, METRICS } from '../../constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useVoiceRecognition from '../../hooks/useVoiceRecognition';
import { ParsedItem } from '../../services/witai';

interface VoiceButtonProps {
  onItemsRecognized: (items: ParsedItem[]) => void;
  style?: ViewStyle;
  size?: number;
  color?: string;
  pulseColor?: string;
  label?: string;
  showLabel?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  onItemsRecognized,
  style,
  size = 56,
  color = COLORS.primary,
  pulseColor = COLORS.primary,
  label = 'Adicionar itens por voz',
  showLabel = true,
}) => {
  const {
    isListening,
    isProcessing,
    results,
    partialResults,
    parsedItems,
    error,
    startListening,
    stopListening,
  } = useVoiceRecognition();

  const [pulseAnim] = useState(new Animated.Value(1));
  const [rippleAnim] = useState(new Animated.Value(0));

  // Effect para notificar quando itens são reconhecidos
  useEffect(() => {
    if (parsedItems.length > 0) {
      onItemsRecognized(parsedItems);
    }
  }, [parsedItems, onItemsRecognized]);

  // Animação de pulso quando estiver escutando
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    let rippleAnimation: Animated.CompositeAnimation;

    if (isListening) {
      // Animação de pulso
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );

      // Animação de ondas
      rippleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();
      rippleAnimation.start();
    } else {
      // Reset das animações
      pulseAnim.setValue(1);
      rippleAnim.setValue(0);
    }

    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
      if (rippleAnimation) {
        rippleAnimation.stop();
      }
    };
  }, [isListening, pulseAnim, rippleAnim]);

  // Handler para toggle de escuta
  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Calcula tamanhos baseados no prop size
  const buttonSize = size;
  const iconSize = size * 0.5;
  const rippleSize = size * 2.5;

  return (
    <View style={[styles.container, style]}>
      {/* Ondas de ripple quando ativo */}
      {isListening && (
        <Animated.View
          style={[
            styles.ripple,
            {
              width: rippleSize,
              height: rippleSize,
              borderRadius: rippleSize / 2,
              borderColor: pulseColor,
              opacity: rippleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0],
              }),
              transform: [
                {
                  scale: rippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      {/* Botão principal */}
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: color,
            },
            isListening && styles.buttonActive,
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Icon
              name={isListening ? 'microphone' : 'microphone-outline'}
              size={iconSize}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Texto/resultados abaixo do botão */}
      {showLabel && (
        <View style={styles.labelContainer}>
          {isListening && partialResults.length > 0 ? (
            <Text style={styles.partialResultText} numberOfLines={1}>
              {partialResults[0]}
            </Text>
          ) : results.length > 0 ? (
            <Text style={styles.resultText} numberOfLines={1}>
              {results[0]}
            </Text>
          ) : (
            <Text style={styles.labelText}>
              {error || label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonActive: {
    elevation: 8,
    shadowOpacity: 0.4,
  },
  ripple: {
    position: 'absolute',
    borderWidth: 1,
    zIndex: -1,
  },
  labelContainer: {
    marginTop: METRICS.smallMargin,
    alignItems: 'center',
  },
  labelText: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.textSecondary,
  },
  resultText: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  partialResultText: {
    fontSize: METRICS.fontSizeSmall,
    color: COLORS.text,
    fontStyle: 'italic',
  },
});

export default VoiceButton;
