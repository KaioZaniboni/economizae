import axios from 'axios';
import {logDebug, logError} from '../utils/debug';
import {withRetry} from '../utils/errorHandler';

// Token de acesso ao Wit.ai (deve ser movido para variáveis de ambiente)
const WIT_AI_TOKEN = 'SEU_TOKEN_AQUI'; // Substitua pelo token real
const WIT_API_VERSION = '20240329'; // Versão da API

interface WitEntity {
  value: string;
  confidence: number;
  start?: number;
  end?: number;
}

interface WitProductEntity extends WitEntity {
  value: string;
}

interface WitQuantityEntity extends WitEntity {
  value: number;
}

interface WitUnitEntity extends WitEntity {
  value: string;
}

export interface WitEntities {
  produto?: Array<WitProductEntity>;
  quantidade?: Array<WitQuantityEntity>;
  unidade?: Array<WitUnitEntity>;
}

export interface WitAiResponse {
  text: string;
  intents: Array<{name: string; confidence: number}>;
  entities: WitEntities;
  traits: Record<string, Array<{value: string; confidence: number}>>;
}

export interface ParsedItem {
  produto: string;
  quantidade: number;
  unidade?: string;
}

/**
 * Envia texto para o Wit.ai e retorna a resposta com entidades identificadas
 * @param text Texto a ser interpretado
 * @returns Resposta do Wit.ai com entidades identificadas
 */
export const sendPhraseToWit = async (text: string): Promise<WitAiResponse> => {
  try {
    // Envio com retry automático em caso de falha temporária
    const response = await withRetry(
      async () => {
        // Codifica o texto para URL
        const encodedText = encodeURIComponent(text);

        // Faz a requisição para o Wit.ai
        const result = await axios.get<WitAiResponse>(
          `https://api.wit.ai/message?v=${WIT_API_VERSION}&q=${encodedText}`,
          {
            headers: {
              Authorization: `Bearer ${WIT_AI_TOKEN}`,
              'Content-Type': 'application/json',
            },
          },
        );

        return result.data;
      },
      3, // Número de tentativas
      1000, // Tempo entre tentativas (ms)
      'WitAiService',
    );

    logDebug('WitAiService', 'Resposta recebida', {
      text,
      entities: response.entities,
    });

    return response;
  } catch (error) {
    logError(
      'WitAiService',
      `Erro ao enviar frase para Wit.ai: ${text}`,
      error,
    );
    throw error;
  }
};

/**
 * Transforma a resposta do Wit.ai em uma lista de itens estruturados
 * @param witResponse Resposta do Wit.ai
 * @returns Lista de itens parseados
 */
export const parseWitResponse = (witResponse: WitAiResponse): ParsedItem[] => {
  const items: ParsedItem[] = [];
  const {entities} = witResponse;

  // Se temos produtos identificados
  if (entities.produto && entities.produto.length > 0) {
    // Para cada produto
    entities.produto.forEach(produtoEntity => {
      const produto = produtoEntity.value;
      let quantidade = 1; // Valor padrão se não for especificado
      let unidade: string | undefined;

      // Tenta encontrar quantidade associada
      // Estratégia: associar por proximidade no texto
      if (entities.quantidade && entities.quantidade.length > 0) {
        // Procura a quantidade mais próxima deste produto no texto
        const produtoStart = produtoEntity.start || 0;
        let closestQuantity = entities.quantidade[0];
        let minDistance = Number.MAX_SAFE_INTEGER;

        entities.quantidade.forEach(quantityEntity => {
          const quantityStart = quantityEntity.start || 0;
          const distance = Math.abs(produtoStart - quantityStart);

          if (distance < minDistance) {
            minDistance = distance;
            closestQuantity = quantityEntity;
          }
        });

        quantidade = closestQuantity.value;
      }

      // Tenta encontrar unidade associada (se existir)
      if (entities.unidade && entities.unidade.length > 0) {
        // Similar ao processo de quantidade
        const produtoStart = produtoEntity.start || 0;
        let closestUnit = entities.unidade[0];
        let minDistance = Number.MAX_SAFE_INTEGER;

        entities.unidade.forEach(unitEntity => {
          const unitStart = unitEntity.start || 0;
          const distance = Math.abs(produtoStart - unitStart);

          if (distance < minDistance) {
            minDistance = distance;
            closestUnit = unitEntity;
          }
        });

        unidade = closestUnit.value;
      }

      // Adiciona o item à lista de resultados
      items.push({
        produto,
        quantidade,
        unidade,
      });
    });
  }

  return items;
};

export default {
  sendPhraseToWit,
  parseWitResponse,
};
