import {useState, useEffect, useCallback} from 'react';
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import {sendPhraseToWit, parseWitResponse, ParsedItem} from '../services/witai';
import {logDebug, logError} from '../utils/debug';

interface VoiceRecognitionState {
  isListening: boolean;
  results: string[];
  partialResults: string[];
  error?: string;
  isProcessing: boolean;
  parsedItems: ParsedItem[];
}

export const useVoiceRecognition = () => {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    results: [],
    partialResults: [],
    isProcessing: false,
    parsedItems: [],
  });

  // Inicializar e limpar o Voice
  useEffect(() => {
    // Configurar listeners
    const onSpeechResults = (e: SpeechResultsEvent) => {
      setState(prev => ({
        ...prev,
        results: e.value ?? [],
      }));
    };

    const onSpeechPartialResults = (e: SpeechResultsEvent) => {
      setState(prev => ({
        ...prev,
        partialResults: e.value ?? [],
      }));
    };

    const onSpeechError = (e: SpeechErrorEvent) => {
      setState(prev => ({
        ...prev,
        error: e.error?.message,
        isListening: false,
      }));
      logError('VoiceRecognition', 'Erro no reconhecimento de voz', e.error);
    };

    const onSpeechEnd = () => {
      setState(prev => ({
        ...prev,
        isListening: false,
      }));

      // Processar os resultados com Wit.ai
      processResults();
    };

    // Adicionar listeners
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;

    // Cleanup ao desmontar
    return () => {
      Voice.destroy().then(() => {
        logDebug('VoiceRecognition', 'Voice destruído');
      });
      Voice.removeAllListeners();
    };
  }, []);

  // Função para processar resultados com Wit.ai
  const processResults = useCallback(async () => {
    const {results} = state;
    if (results.length === 0) {
      return;
    }

    try {
      setState(prev => ({...prev, isProcessing: true}));

      const text = results[0]; // Pegamos o primeiro resultado (mais provável)
      logDebug('VoiceRecognition', 'Processando texto', {text});

      // Enviar para o Wit.ai
      const witResponse = await sendPhraseToWit(text);

      // Parsear a resposta
      const parsedItems = parseWitResponse(witResponse);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        parsedItems,
      }));

      logDebug('VoiceRecognition', 'Itens processados', {parsedItems});
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Falha ao processar o comando de voz',
      }));
      logError('VoiceRecognition', 'Erro ao processar com Wit.ai', error);
    }
  }, [state.results]);

  // Função para iniciar a escuta
  const startListening = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        isListening: true,
        results: [],
        partialResults: [],
        error: undefined,
        parsedItems: [],
      }));

      await Voice.start('pt-BR');
      logDebug('VoiceRecognition', 'Iniciando escuta de voz');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isListening: false,
        error: 'Falha ao iniciar o reconhecimento de voz',
      }));
      logError('VoiceRecognition', 'Erro ao iniciar escuta', error);
    }
  }, []);

  // Função para parar a escuta
  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
      setState(prev => ({
        ...prev,
        isListening: false,
      }));
      logDebug('VoiceRecognition', 'Parando escuta de voz');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Falha ao parar o reconhecimento de voz',
      }));
      logError('VoiceRecognition', 'Erro ao parar escuta', error);
    }
  }, []);

  // Função para resetar o estado
  const resetState = useCallback(() => {
    setState({
      isListening: false,
      results: [],
      partialResults: [],
      isProcessing: false,
      parsedItems: [],
    });
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetState,
  };
};

export default useVoiceRecognition;
