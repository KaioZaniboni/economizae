import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { COLORS, METRICS } from '../../constants';

type ErrorLevel = 'info' | 'warning' | 'error' | 'success';

type ErrorNotificationProps = {
  visible: boolean;
  message: string;
  level?: ErrorLevel;
  timeout?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
};

/**
 * Componente para exibir notificações de erro, avisos ou informações
 * Otimizado para performance e adaptável a diferentes situações
 */
const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  visible,
  message,
  level = 'error',
  timeout = 4000,
  onDismiss,
  action,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cores e ícones com base no nível de severidade
  const getColorForLevel = (): string => {
    switch (level) {
      case 'info': return COLORS.info;
      case 'warning': return COLORS.warning;
      case 'error': return COLORS.error;
      case 'success': return COLORS.success;
      default: return COLORS.error;
    }
  };

  const getIconForLevel = (): string => {
    switch (level) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return '❌';
    }
  };

  // Função para esconder a notificação
  const dismiss = useCallback(() => {
    // Animações de saída
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      if (onDismiss) {onDismiss();}
    });
  }, [translateY, opacity, onDismiss]);

  // Controlador de visibilidade
  useEffect(() => {
    if (visible) {
      setModalVisible(true);

      // Animações de entrada
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Configurar desaparecimento automático
      if (timeout > 0) {
        if (timeoutRef.current) {clearTimeout(timeoutRef.current);}
        timeoutRef.current = setTimeout(dismiss, timeout);
      }
    } else {
      dismiss();
    }

    return () => {
      if (timeoutRef.current) {clearTimeout(timeoutRef.current);}
    };
  }, [visible, message, timeout, dismiss, translateY, opacity]);

  const handlePress = useCallback(() => {
    if (action) {
      action.onPress();
    }
    dismiss();
  }, [action, dismiss]);

  if (!modalVisible) {return null;}

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.notification,
            {
              backgroundColor: getColorForLevel() + '15', // Fundo com transparência
              borderColor: getColorForLevel(),
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <View style={styles.content}>
            <Text style={styles.icon}>{getIconForLevel()}</Text>
            <Text
              style={[styles.message, { color: level === 'error' ? COLORS.error : COLORS.text }]}
              numberOfLines={2}
            >
              {message}
            </Text>
          </View>

          <View style={styles.actions}>
            {action && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getColorForLevel() }]}
                onPress={handlePress}
              >
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 9999,
  },
  notification: {
    width: width - 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: METRICS.padding.md,
    paddingVertical: METRICS.padding.sm,
    borderRadius: METRICS.borderRadii.md,
    borderLeftWidth: 4,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: METRICS.borderRadii.sm,
    marginRight: 10,
  },
  actionText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default ErrorNotification;
