import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

/**
 * Componente simples para depuração de problemas de renderização
 */
const DebugComponent = () => {
    useEffect(() => {
        console.log('DebugComponent montado!');
        return () => {
            console.log('DebugComponent desmontado!');
        };
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Componente de Depuração</Text>
            <Text style={styles.subtext}>Se você consegue ver este texto, a renderização está funcionando.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        padding: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        zIndex: 9999,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 5,
    },
    subtext: {
        fontSize: 14,
        color: COLORS.text,
    },
});

export default DebugComponent;
