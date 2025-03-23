/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY)
 */
export const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
};

/**
 * Formata uma data para exibição em formato de mensagem relativa
 * (ex: "há 2 dias", "hoje", "ontem")
 */
export const formatRelativeDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'hoje';
  } else if (diffDays === 1) {
    return 'ontem';
  } else if (diffDays < 7) {
    return `há ${diffDays} dias`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
  }
};

/**
 * Obtém a data de início e fim da semana atual
 */
export const getCurrentWeekDates = (): { start: Date; end: Date } => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = domingo, 6 = sábado
  
  // Calcula o início da semana (domingo)
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - currentDay);
  startDate.setHours(0, 0, 0, 0);
  
  // Calcula o fim da semana (sábado)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { start: startDate, end: endDate };
};

/**
 * Obtém a data de início e fim do mês atual
 */
export const getCurrentMonthDates = (): { start: Date; end: Date } => {
  const now = new Date();
  
  // Início do mês
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);
  
  // Fim do mês
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { start: startDate, end: endDate };
}; 