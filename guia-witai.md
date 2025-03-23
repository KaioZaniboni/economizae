# 🗣 Guia de Integração com Wit.ai - Economizae

Este documento descreve como integrar o app Economizae ao sistema de Processamento de Linguagem Natural da Meta (Wit.ai)  
e como estruturar o envio e interpretação de comandos de voz dentro da jornada do usuário.

---

## 🎯 Objetivo

Permitir que o usuário diga frases como:
> “3 maçãs, um leite e um pacote de arroz”

E o sistema transforme isso em:
```json
[
  { "produto": "maçã", "quantidade": 3 },
  { "produto": "leite", "quantidade": 1 },
  { "produto": "arroz", "quantidade": 1 }
]
```

---

## 🧩 Como funciona

1. Usuário clica no botão de microfone
2. A fala é capturada pelo app (biblioteca `react-native-voice`)
3. O áudio é transformado em texto localmente
4. O texto é enviado para a API do Wit.ai
5. O Wit.ai retorna as entidades identificadas
6. O app interpreta e converte em itens da lista de compras

---

## 🔐 Configuração no Wit.ai

1. Criar uma conta em [https://wit.ai](https://wit.ai)
2. Criar um app com o nome `Economizae`
3. Ativar idioma português (pt_BR)
4. Criar as seguintes entidades:
   - `produto` (free-text, pode ter lookup)
   - `quantidade` (built-in `wit/number`)
   - `unidade` (opcional, ex: kg, pacote, caixa)

---

## 🔁 Envio de Frases para Treinamento

Frases reais do app podem ser capturadas e enviadas para melhorar o entendimento:
```json
POST https://api.wit.ai/utterances
Authorization: Bearer {WIT_AI_SERVER_TOKEN}
Content-Type: application/json

[
  {
    "text": "2 tomates e um pacote de macarrão",
    "entities": [
      { "entity": "quantidade", "start": 0, "end": 1, "value": "2" },
      { "entity": "produto", "start": 2, "end": 9, "value": "tomates" },
      { "entity": "quantidade", "start": 14, "end": 15, "value": "1" },
      { "entity": "produto", "start": 23, "end": 31, "value": "macarrão" }
    ]
  }
]
```

---

## 🧪 Exemplo de código de integração

```ts
const resposta = await axios.post(
  'https://api.wit.ai/message?v=20240329&q=3 ovos e 1 leite',
  {},
  {
    headers: {
      Authorization: `Bearer ${WIT_AI_TOKEN}`
    }
  }
);
```

---

## 📂 Organização no App

- `src/services/witai.ts` → contém `sendPhraseToWit(text)` que envia frase e retorna entidades
- `src/hooks/useVoiceRecognition.ts` → gerencia estado de escuta, ativação e envio
- `src/screens/VoiceInputScreen.tsx` → tela de entrada de voz e preview do resultado

---

## 📌 Padrões de Qualidade

- Frases não compreendidas devem ser reaproveitadas para treino futuro
- Feedback dos usuários deve ser logado
- Cada versão do app deve revalidar o entendimento do Wit.ai

---

## 📊 Métricas Sugeridas

- % de frases compreendidas sem ambiguidade
- Tempo médio de interpretação
- Entidades mais reconhecidas vs mais ignoradas
- Sugestão automática de reenvio de frases com erro

---

## 🧠 IA + Wit.ai

A IA local pode ser usada para:
- Sugerir formas alternativas de dizer a mesma frase
- Corrigir frases que não foram compreendidas pelo Wit.ai
- Avaliar ambiguidade semântica com base no histórico do usuário

---

Com esse guia, qualquer desenvolvedor ou IA que leia o projeto sabe exatamente como integrar e manter o fluxo de voz confiável e produtivo.