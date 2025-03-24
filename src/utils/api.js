import { useLogs } from '../contexts/LogContext';

// Cliente de API com monitoramento de logs
const createApiClient = (baseUrl) => {
    // Função que será exportada para componentes usarem
    return () => {
        const { logApi, logError } = useLogs();

        // Wrapper para fetch com logs automáticos
        const fetchWithLogs = async (endpoint, options = {}) => {
            const url = `${baseUrl}${endpoint}`;
            const method = options.method || 'GET';
            const requestData = options.body ? JSON.parse(options.body) : null;

            try {
                // Executa a requisição
                const response = await fetch(url, options);
                const responseData = await response.json();

                // Registra o log da API
                logApi(
                    endpoint,
                    method,
                    requestData,
                    responseData,
                    response.ok
                );

                // Se a resposta não for ok, lança um erro
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                return responseData;
            } catch (error) {
                // Registra o erro
                logError(error, `API ${method} ${endpoint}`);
                throw error;
            }
        };

        // Métodos do cliente de API
        return {
            get: (endpoint, options = {}) => {
                return fetchWithLogs(endpoint, {
                    ...options,
                    method: 'GET',
                });
            },

            post: (endpoint, data, options = {}) => {
                return fetchWithLogs(endpoint, {
                    ...options,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers,
                    },
                    body: JSON.stringify(data),
                });
            },

            put: (endpoint, data, options = {}) => {
                return fetchWithLogs(endpoint, {
                    ...options,
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers,
                    },
                    body: JSON.stringify(data),
                });
            },

            delete: (endpoint, options = {}) => {
                return fetchWithLogs(endpoint, {
                    ...options,
                    method: 'DELETE',
                });
            },
        };
    };
};

// Exemplo: criar uma instância para a API principal
export const useApi = createApiClient('https://api.sua-api.com');

// Outras APIs podem ser criadas com diferentes URLs base
// export const useOtherApi = createApiClient('https://outra-api.com');
