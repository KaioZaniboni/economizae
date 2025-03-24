import React, { createContext, useContext, useState, useCallback } from 'react';

// Criando o contexto de logs
export const LogContext = createContext();

// Tipos de logs
export const LOG_TYPES = {
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    INTERACTION: 'INTERACTION',
    NAVIGATION: 'NAVIGATION',
    API: 'API',
};

// Provedor de logs
export const LogProvider = ({ children }) => {
    const [logs, setLogs] = useState([]);

    // Função para adicionar um novo log
    const addLog = useCallback((type, message, data = {}) => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            data,
            timestamp,
        };

        // Adiciona o log ao estado
        setLogs(prevLogs => [logEntry, ...prevLogs]);

        // Exibe o log no console do desenvolvedor
        console.log(`[${type}] ${message}`, data);

        return logEntry;
    }, []);

    // Função para limpar todos os logs
    const clearLogs = useCallback(() => {
        setLogs([]);
        console.log('[SYSTEM] Logs limpos');
    }, []);

    // Registra interação do usuário
    const logInteraction = useCallback((componentName, action, extraData = {}) => {
        return addLog(
            LOG_TYPES.INTERACTION,
            `${componentName} - ${action}`,
            extraData
        );
    }, [addLog]);

    // Registra navegação
    const logNavigation = useCallback((from, to, params = {}) => {
        return addLog(
            LOG_TYPES.NAVIGATION,
            `Navegação: ${from} -> ${to}`,
            { from, to, params }
        );
    }, [addLog]);

    // Registra chamadas de API
    const logApi = useCallback((endpoint, method, requestData, responseData, success) => {
        return addLog(
            LOG_TYPES.API,
            `API ${method} ${endpoint} - ${success ? 'Sucesso' : 'Falha'}`,
            { endpoint, method, requestData, responseData, success }
        );
    }, [addLog]);

    // Registra erros
    const logError = useCallback((error, source = 'Desconhecido') => {
        return addLog(
            LOG_TYPES.ERROR,
            `Erro em ${source}`,
            {
                message: error.message,
                stack: error.stack,
                source,
            }
        );
    }, [addLog]);

    // Valores expostos pelo contexto
    const value = {
        logs,
        addLog,
        clearLogs,
        logInteraction,
        logNavigation,
        logApi,
        logError,
    };

    return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
};

// Hook personalizado para usar o contexto de logs
export const useLogs = () => {
    const context = useContext(LogContext);
    if (context === undefined) {
        throw new Error('useLogs deve ser usado dentro de um LogProvider');
    }
    return context;
};
