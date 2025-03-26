# 🎙️ Guia do Componente VoiceButton - Economizae

Este documento explica como utilizar o componente `VoiceButton` no projeto Economizae para reconhecimento de voz e processamento com Wit.ai.

## 📋 Requisitos

Para usar corretamente este componente, você precisa:

1. **Instalar as dependências:**

   ```bash
   npm install @react-native-voice/voice react-native-vector-icons
   # ou
   yarn add @react-native-voice/voice react-native-vector-icons
   ```

2. **Configurar as permissões:**

   **Android (em android/app/src/main/AndroidManifest.xml):**

   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   ```

   **iOS (em ios/[Nome_do_Projeto]/Info.plist):**

   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>Este aplicativo precisa acessar o microfone para reconhecimento de voz</string>
   <key>NSSpeechRecognitionUsageDescription</key>
   <string>Este aplicativo precisa acessar o reconhecimento de fala para entender comandos</string>
   ```

3. **Configurar o Wit.ai:**
   - Crie uma conta em [wit.ai](https://wit.ai)
   - Configure um app com as entidades conforme [guia-witai.md](./guia-witai.md)
   - Substitua o token em `src/services/witai.ts`

## 🚀 Como Utilizar

O componente pode ser importado e utilizado em qualquer tela ou componente:

```tsx
import {VoiceButton} from '../components/common';
import {ParsedItem} from '../services/witai';

const MyComponent = () => {
  const handleItemsRecognized = (items: ParsedItem[]) => {
    console.log('Itens reconhecidos:', items);
    // Faça algo com os itens reconhecidos
  };

  return (
    <View style={styles.container}>
      <Text>Minha Lista de Compras</Text>

      {/* Uso básico */}
      <VoiceButton onItemsRecognized={handleItemsRecognized} />

      {/* Personalizado */}
      <VoiceButton
        onItemsRecognized={handleItemsRecognized}
        size={64}
        color="#FF5722"
        pulseColor="#FF9800"
        label="Fale os itens para adicionar"
        showLabel={true}
      />
    </View>
  );
};
```

## ⚙️ Propriedades

| Propriedade         | Tipo                            | Obrigatório | Descrição                                                         |
| ------------------- | ------------------------------- | ----------- | ----------------------------------------------------------------- |
| `onItemsRecognized` | `(items: ParsedItem[]) => void` | Sim         | Callback chamado quando itens são reconhecidos                    |
| `size`              | `number`                        | Não         | Tamanho do botão (padrão: 56)                                     |
| `color`             | `string`                        | Não         | Cor principal do botão (padrão: COLORS.primary)                   |
| `pulseColor`        | `string`                        | Não         | Cor do efeito de pulso (padrão: COLORS.primary)                   |
| `label`             | `string`                        | Não         | Texto exibido abaixo do botão (padrão: "Adicionar itens por voz") |
| `showLabel`         | `boolean`                       | Não         | Mostrar ou não o label (padrão: true)                             |
| `style`             | `ViewStyle`                     | Não         | Estilo adicional para o container                                 |

## 🔄 Fluxo de Funcionamento

1. Usuário pressiona o botão
2. O microfone é ativado e começa a escutar
3. As transcrições parciais são exibidas abaixo do botão
4. Quando o usuário para de falar, o texto é enviado ao Wit.ai
5. O Wit.ai identifica produtos, quantidades e unidades
6. O callback `onItemsRecognized` é chamado com os itens reconhecidos

## 🔍 Estrutura do Resultado (ParsedItem)

```ts
interface ParsedItem {
  produto: string; // Nome do produto
  quantidade: number; // Quantidade
  unidade?: string; // Unidade opcional (kg, pacote, etc)
}
```

## 🛠️ Resolução de Problemas

Se o componente não funcionar conforme esperado:

1. Verifique se as permissões estão configuradas corretamente
2. Confirme que o token do Wit.ai está correto e ativo
3. Teste com frases simples como "3 maçãs e 1 leite"
4. Verifique os logs de erros no console

## 📈 Melhorias Futuras

- Suporte a cancelamento de reconhecimento
- Feedbacks visuais mais elaborados
- Suporte a múltiplos idiomas
- Treinamento contínuo do modelo com feedback do usuário
