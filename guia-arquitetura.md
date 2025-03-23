# Guia Técnico - App Lista de Compras em React Native

Este guia resume a estrutura técnica, arquitetura e boas práticas para garantir que o desenvolvimento do app se mantenha alinhado com os pilares de escalabilidade, performance e manutenibilidade.

---

## Índice
- [Guia Complementar: Integração com Wit.ai](./guia-witai.md)

- [1. Arquitetura de Pastas](#1-arquitetura-de-pastas)
- [2. Bibliotecas e Ferramentas Essenciais](#2-bibliotecas-e-ferramentas-essenciais)
- [3. Estratégias para Código Limpo e Escalável](#3-estratégias-para-código-limpo-e-escalável)
- [4. Integração com Wit.ai e Feedbacks](#4-integração-com-witai-e-feedbacks)
- [5. Backend: API, Banco de Dados e Autenticação Google](#5-backend-api-banco-de-dados-e-autenticação-google)
- [6. Cache, Persistência e Offline-First](#6-cache-persistência-e-offline-first)
- [7. Testes, Atualizações e Versionamento](#7-testes-atualizações-e-versionamento)
- [8. Pontos de Atenção Futuros](#8-pontos-de-atenção-futuros)
- [9. Otimizações de Performance](#9-otimizações-de-performance)
- [10. Monitoramento de Performance e Erros](#10-monitoramento-de-performance-e-erros)

---

## 1. Arquitetura de Pastas

Defina a estrutura modular e escalável com base em `src/`, contendo `components/`, `screens/`, `navigation/`, `services/`, `state/`, `utils/`, `constants/`.

## 2. Bibliotecas e Ferramentas Essenciais

Use:
- `react-navigation` para navegação
- `redux + redux-persist` ou `context + asyncStorage`
- `axios` ou `fetch` para chamadas HTTP
- `react-native-voice` para voz
- `react-native-google-mobile-ads` para AdMob
- `@react-native-firebase/analytics`, `sentry/react-native` para monitoramento

## 3. Estratégias para Código Limpo e Escalável

- Separação de lógica e UI com hooks customizados
- Componentização e reutilização
- Uso de `React.memo`, `useCallback`, `useSelector` eficiente
- Uso de TypeScript para tipagem robusta

## 4. Integração com Wit.ai e Feedbacks

- Captura de voz via `react-native-voice`
- Envio para Wit.ai via API Message
- Feedback manual/automático para melhorar entendimento
- Exibir confirmação de comando reconhecido ao usuário

## 5. Backend: API, Banco de Dados e Autenticação Google

- API RESTful (Node/Express ou Firebase)
- Banco MongoDB (flexível) ou PostgreSQL (relacional)
- Autenticação Google segura com Firebase Auth ou OAuth2 com validação de ID Token
- Endpoints para itens, pontuação, conquistas e feedbacks

## 6. Cache, Persistência e Offline-First

- Uso de `redux-persist` com `AsyncStorage`
- Fila local para operações offline
- Sincronização ao recuperar rede
- `@react-native-community/netinfo` para status da conexão

## 7. Testes, Atualizações e Versionamento

- Testes unitários com `jest` + `@testing-library/react-native`
- Testes E2E com `detox`
- Atualizações OTA com CodePush ou Expo Updates
- Versionamento Semântico e CI com validação de testes

## 8. Pontos de Atenção Futuros

- Modularização ao escalar
- Integração futura com notificações, compras in-app, internacionalização
- Segurança com tokens e uso de armazenamento seguro
- Planejamento de backend para ranking e multiplayer

## 9. Otimizações de Performance

- Uso de `FlatList` e `React.memo`
- Ativação do Hermes Engine
- Animações com `Reanimated`
- Lazy loading e divisão de tarefas assíncronas

## 10. Monitoramento de Performance e Erros

- Sentry para erros JS
- Firebase Crashlytics para crashes nativos
- Firebase Analytics para comportamento de usuário
- Logs e alertas para API e UI

---

Este guia deve ser consultado a cada nova funcionalidade para manter o alinhamento técnico com os pilares do projeto. Atualize-o conforme necessário.

---

📎 **Guia Complementar**  
Consulte também o arquivo [`guia-witai.md`](./guia-witai.md) para detalhes técnicos da integração com o Wit.ai.
