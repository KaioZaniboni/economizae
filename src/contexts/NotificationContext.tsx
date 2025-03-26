import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ErrorNotification } from '../components/common';

type NotificationLevel = 'info' | 'warning' | 'error' | 'success';

type Notification = {
  message: string;
  level: NotificationLevel;
  timeout?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
};

type NotificationContextType = {
  showNotification: (notification: Notification) => void;
  hideNotification: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type NotificationProviderProps = {
  children: ReactNode;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);

  const showNotification = useCallback((newNotification: Notification) => {
    setNotification(newNotification);
    setVisible(true);
  }, []);

  const hideNotification = useCallback(() => {
    setVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && (
        <ErrorNotification
          visible={visible}
          message={notification.message}
          level={notification.level}
          timeout={notification.timeout}
          action={notification.action}
          onDismiss={handleDismiss}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Funções auxiliares para notificações específicas
export const useErrorNotification = () => {
  const { showNotification } = useNotification();

  return useCallback((message: string, action?: Notification['action'], timeout?: number) => {
    showNotification({
      message,
      level: 'error',
      action,
      timeout: timeout || 5000,
    });
  }, [showNotification]);
};

export const useSuccessNotification = () => {
  const { showNotification } = useNotification();

  return useCallback((message: string, timeout?: number) => {
    showNotification({
      message,
      level: 'success',
      timeout: timeout || 3000,
    });
  }, [showNotification]);
};

export const useInfoNotification = () => {
  const { showNotification } = useNotification();

  return useCallback((message: string, timeout?: number) => {
    showNotification({
      message,
      level: 'info',
      timeout: timeout || 4000,
    });
  }, [showNotification]);
};

export const useWarningNotification = () => {
  const { showNotification } = useNotification();

  return useCallback((message: string, action?: Notification['action'], timeout?: number) => {
    showNotification({
      message,
      level: 'warning',
      action,
      timeout: timeout || 4000,
    });
  }, [showNotification]);
};
