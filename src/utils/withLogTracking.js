import React, { useCallback } from 'react';
import { useLogs } from '../contexts/LogContext';

/**
 * HOC para rastrear interações em componentes
 * @param {React.Component} WrappedComponent - O componente a ser rastreado
 * @param {string} componentName - Nome do componente (opcional, usa displayName ou name se não fornecido)
 * @returns {React.Component} - Componente rastreado
 */
const withLogTracking = (WrappedComponent, componentName) => {
    // Nome para o componente
    const displayName = componentName ||
        WrappedComponent.displayName ||
        WrappedComponent.name ||
        'UnknownComponent';

    // Função de wrapper
    const WithLogTracking = (props) => {
        const { logInteraction, logError } = useLogs();

        // Função para rastrear interações
        const trackInteraction = useCallback((actionName, data = {}) => {
            logInteraction(displayName, actionName, data);
        }, [logInteraction]);

        // Função para rastrear erros
        const trackError = useCallback((error, source = 'unknown') => {
            logError(error, `${displayName}:${source}`);
        }, [logError]);

        // Renderiza o componente original com props adicionais
        try {
            return (
                <WrappedComponent
                    {...props}
                    trackInteraction={trackInteraction}
                    trackError={trackError}
                />
            );
        } catch (error) {
            // Captura erros de renderização
            logError(error, `${displayName} render`);
            throw error;
        }
    };

    // Define o displayName para facilitar a depuração
    WithLogTracking.displayName = `WithLogTracking(${displayName})`;

    return WithLogTracking;
};

export default withLogTracking;
