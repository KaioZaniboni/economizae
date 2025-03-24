import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useLogs } from '../contexts/LogContext';
import withLogTracking from '../utils/withLogTracking';

const ExampleComponent = ({ trackInteraction }) => {
    const [counter, setCounter] = useState(0);
    const { addLog, logError } = useLogs();

    // Função para incrementar o contador
    const handleIncrement = () => {
        // Log manual usando o contexto diretamente
        addLog('INFO', 'Contador incrementado manualmente', { counter, newValue: counter + 1 });

        // Log usando o HOC withLogTracking
        trackInteraction('increment', { counterValue: counter, newValue: counter + 1 });

        // Atualiza o estado
        setCounter(counter + 1);
    };

    // Função para decrementar o contador
    const handleDecrement = () => {
        // Log usando o HOC withLogTracking
        trackInteraction('decrement', { counterValue: counter, newValue: counter - 1 });

        // Atualiza o estado
        setCounter(counter - 1);
    };

    // Função para simular um erro
    const handleSimulateError = () => {
        try {
            // Simulamos um erro
            throw new Error('Erro simulado para demonstração');
        } catch (error) {
            // Log do erro
            logError(error, 'simulateError');

            // Log usando o HOC withLogTracking
            trackInteraction('error_simulation', { error: error.message });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Componente de Exemplo</Text>
            <Text style={styles.counter}>{counter}</Text>

            <View style={styles.buttonContainer}>
                <Button
                    title="Incrementar"
                    onPress={handleIncrement}
                />
                <Button
                    title="Decrementar"
                    onPress={handleDecrement}
                />
                <Button
                    title="Simular Erro"
                    onPress={handleSimulateError}
                    color="#e74c3c"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    counter: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
});

// Exportamos o componente com o rastreamento de logs
export default withLogTracking(ExampleComponent, 'ExampleCounter');
