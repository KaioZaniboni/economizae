import { useEffect, useRef } from 'react';
import { useLogs } from '../contexts/LogContext';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * Hook para monitorar automaticamente a navegação entre telas
 * Deve ser usado em cada tela que deseja monitorar
 * @returns {void}
 */
const useLogNavigation = () => {
    const { logNavigation } = useLogs();
    const navigation = useNavigation();
    const route = useRoute();

    // Referência para a tela anterior
    const prevRouteRef = useRef(null);

    useEffect(() => {
        // Captura os parâmetros da rota atual
        const currentRouteName = route.name;
        const params = route.params || {};

        // Se temos uma rota anterior, registramos a navegação
        if (prevRouteRef.current) {
            logNavigation(prevRouteRef.current, currentRouteName, params);
        } else {
            // Para a primeira tela, registramos como uma entrada inicial
            logNavigation('AppStart', currentRouteName, params);
        }

        // Registra as alterações de foco
        const unsubscribeFocus = navigation.addListener('focus', () => {
            if (prevRouteRef.current !== currentRouteName) {
                logNavigation(prevRouteRef.current || 'Unknown', currentRouteName, params);
            }
            prevRouteRef.current = currentRouteName;
        });

        // Registra quando a tela é desfocada
        const unsubscribeBlur = navigation.addListener('blur', () => {
            // Não fazemos nada aqui, apenas atualizamos a referência
        });

        // Limpa os listeners quando o componente é desmontado
        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [navigation, route, logNavigation]);

    // Não retornamos nada, pois este hook é apenas para monitoramento
    return null;
};

export default useLogNavigation;
