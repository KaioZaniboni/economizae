import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useLogs, LOG_TYPES } from '../contexts/LogContext';
import { COLORS, METRICS, FONTS } from '../constants';

// Cores para diferentes tipos de logs
const LOG_COLORS = {
    [LOG_TYPES.INFO]: '#3498db',
    [LOG_TYPES.WARN]: '#f39c12',
    [LOG_TYPES.ERROR]: '#e74c3c',
    [LOG_TYPES.INTERACTION]: '#2ecc71',
    [LOG_TYPES.NAVIGATION]: '#9b59b6',
    [LOG_TYPES.API]: '#1abc9c',
};

// Componente para monitorar logs
const LogMonitor = ({ visible = false, onClose }) => {
    const { logs, clearLogs } = useLogs();
    const [selectedLog, setSelectedLog] = useState(null);
    const [filter, setFilter] = useState(null);

    // Filtra os logs pelo tipo
    const filteredLogs = filter
        ? logs.filter(log => log.type === filter)
        : logs;

    // Renderiza um item de log
    const renderLogItem = (log) => {
        const { id, type, message, timestamp } = log;
        const time = new Date(timestamp).toLocaleTimeString();

        return (
            <TouchableOpacity
                key={id}
                style={[styles.logItem, { borderLeftColor: LOG_COLORS[type] || '#999' }]}
                onPress={() => setSelectedLog(log)}
            >
                <Text style={styles.logTime}>{time}</Text>
                <Text style={styles.logType}>{type}</Text>
                <Text style={styles.logMessage} numberOfLines={1}>{message}</Text>
            </TouchableOpacity>
        );
    };

    // Renderiza o detalhe de um log selecionado
    const renderLogDetail = () => {
        if (!selectedLog) { return null; }

        return (
            <Modal
                transparent
                visible={!!selectedLog}
                animationType="slide"
                onRequestClose={() => setSelectedLog(null)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalhes do Log</Text>
                            <TouchableOpacity onPress={() => setSelectedLog(null)}>
                                <Text style={styles.closeModalButton}>Fechar</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.detailContainer}>
                            <Text style={styles.detailType}>{selectedLog.type}</Text>
                            <Text style={styles.detailTime}>{new Date(selectedLog.timestamp).toLocaleString()}</Text>
                            <Text style={styles.detailMessage}>{selectedLog.message}</Text>

                            <Text style={styles.detailDataTitle}>Dados:</Text>
                            <Text style={styles.detailData}>
                                {JSON.stringify(selectedLog.data, null, 2)}
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    // Renderiza os filtros de tipo de log
    const renderFilters = () => {
        return (
            <ScrollView horizontal style={styles.filtersContainer} showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                    style={[styles.filterButton, !filter && styles.activeFilter]}
                    onPress={() => setFilter(null)}
                >
                    <Text style={styles.filterText}>Todos</Text>
                </TouchableOpacity>

                {Object.values(LOG_TYPES).map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.filterButton,
                            { backgroundColor: LOG_COLORS[type] },
                            filter === type && styles.activeFilter,
                        ]}
                        onPress={() => setFilter(type)}
                    >
                        <Text style={styles.filterText}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    if (!visible) { return null; }

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Monitor de Logs</Text>

                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
                            <Text style={styles.clearButtonText}>Limpar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {renderFilters()}

                <ScrollView style={styles.logList}>
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map(renderLogItem)
                    ) : (
                        <Text style={styles.emptyText}>Nenhum log registrado</Text>
                    )}
                </ScrollView>

                {renderLogDetail()}
            </View>
        </Modal>
    );
};

// Estilos
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    headerButtons: {
        flexDirection: 'row',
    },
    clearButton: {
        marginRight: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#e74c3c',
        borderRadius: 5,
    },
    clearButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    closeButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#333',
        borderRadius: 5,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    filtersContainer: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    filterButton: {
        marginRight: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: '#555',
        borderRadius: 5,
    },
    activeFilter: {
        borderWidth: 2,
        borderColor: 'white',
    },
    filterText: {
        color: 'white',
        fontWeight: 'bold',
    },
    logList: {
        flex: 1,
    },
    logItem: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        borderLeftWidth: 5,
    },
    logTime: {
        fontSize: 12,
        color: '#aaa',
        marginBottom: 2,
    },
    logType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    logMessage: {
        fontSize: 14,
        color: 'white',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        color: '#aaa',
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: '#222',
        borderRadius: 10,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    closeModalButton: {
        color: '#3498db',
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailContainer: {
        padding: 15,
    },
    detailType: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    detailTime: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 10,
    },
    detailMessage: {
        fontSize: 16,
        color: 'white',
        marginBottom: 15,
    },
    detailDataTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
    },
    detailData: {
        fontSize: 14,
        color: '#ddd',
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        fontFamily: FONTS.mono.regular,
    },
});

export default LogMonitor;
