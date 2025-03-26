import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { COLORS, METRICS } from '../../constants';
import { logDebug } from '../../utils/debug';

const TAG = 'CollapsibleSection';

type CollapsibleSectionProps = {
  title: string;
  titleColor?: string;
  backgroundColor?: string;
  count?: number | null;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  countLabel?: string;
  pluralCountLabel?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  contentContainerStyle?: ViewStyle;
};

/**
 * Componente simplificado de seção colapsável
 * Projetado para evitar problemas de renderização e sincronização de estados
 */
const CollapsibleSection = ({
  title,
  titleColor = COLORS.primary,
  backgroundColor,
  count = null,
  isCollapsed,
  onToggle,
  children,
  countLabel = 'item',
  pluralCountLabel = 'itens',
  style,
  titleStyle,
  contentContainerStyle,
}: CollapsibleSectionProps) => {
  // Estado local para controle direto da visualização
  const [localCollapsed, setLocalCollapsed] = useState(isCollapsed);

  // Sempre que a prop isCollapsed mudar, atualizamos o estado local
  useEffect(() => {
    logDebug(TAG, `[${title}] Prop isCollapsed mudou para: ${isCollapsed}`);
    setLocalCollapsed(isCollapsed);
  }, [isCollapsed, title]);

  // Cálculo do texto de contagem
  const countText = count !== null ? `${count} ${count === 1 ? countLabel : pluralCountLabel}` : '';

  // Definir cor de fundo com opacidade se não for fornecida
  const bgColor = backgroundColor || `${titleColor}30`;

  // Manipulador simplificado para toggle
  const handleToggle = () => {
    const newState = !localCollapsed;
    logDebug(TAG, `[${title}] Toggle clicado. Estado atual: ${localCollapsed}, Novo estado: ${newState}`);

    // Atualizamos imediatamente o estado local para resposta visual instantânea
    setLocalCollapsed(newState);

    // Notificamos o componente pai
    onToggle();
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.header, { backgroundColor: bgColor }]}
        onPress={handleToggle}
        activeOpacity={0.5}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: titleColor }, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
          {count !== null && (
            <View style={styles.headerRight}>
              <Text style={styles.countText}>{countText}</Text>
              <Text style={[styles.collapseIcon, { color: titleColor }]}>
                {localCollapsed ? '▼' : '▲'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <Collapsible
        collapsed={localCollapsed}
        duration={200}
      >
        <View style={[styles.content, contentContainerStyle]}>
          {children}
        </View>
      </Collapsible>
    </View>
  );
};

// Estilos otimizados para o componente
const styles = StyleSheet.create({
  container: {
    marginBottom: METRICS.margin.md,
  },
  header: {
    paddingHorizontal: METRICS.padding.md,
    paddingVertical: METRICS.padding.sm,
    borderRadius: METRICS.borderRadii.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  collapseIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: METRICS.padding.sm,
    paddingTop: METRICS.padding.sm,
  },
});

export default CollapsibleSection;
