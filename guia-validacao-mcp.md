# ✅ Guia de Validação de Tarefas - MCP Economizae

Este documento define as regras e critérios que o sistema MCP e o desenvolvedor devem seguir para validar se uma tarefa técnica foi realmente implementada de forma funcional e relevante no app Economizae.

---

## 🎯 Objetivo

Evitar que tarefas sejam marcadas como "concluídas" sem terem impacto real no app.

---

## 🔍 O que é considerado uma tarefa validada?

Uma tarefa é considerada **VALIDADA** quando:

- ✅ Existe código-fonte no diretório `/src` correspondente à tarefa
- ✅ Esse código é utilizado em um fluxo de navegação real
- ✅ Há pelo menos um dos seguintes sinais de uso:
  - Navegação (`navigate("...")`)
  - Atribuição de props visíveis (`<Componente title="..." />`)
  - Acionamento via evento (`onPress`, `onSubmit`, `onStartListening`)
  - Registro em analytics ou log
- ✅ É possível mapear o nome da tarefa no código ou nos commits recentes
- ✅ Ela está listada no `MCP_STATUS.md` e tem histórico de alteração em `STATUS_HISTORY.md`

---

## 🚫 O que **não valida** uma tarefa

- Criar um arquivo vazio ou com nome genérico
- Comentar código como “a implementar”
- Criar estrutura sem navegar para ela
- Criar componentes sem conexão com estado real
- Criar lógica que não é usada por nenhuma tela

---

## 🛠 Como o MCP valida isso automaticamente

O MCP possui lógica para:

- Procurar arquivos com nomes similares à tarefa (`homeVoiceInput`, `useVoiceFeedback`)
- Verificar se há uso de `navigate`, `useEffect`, `setState`, `return <View>`
- Mapear entidades de código com base nos guias e status
- Gerar logs no `STATUS_HISTORY.md` toda vez que uma tarefa é marcada como concluída

---

## 📋 Regras de nomenclatura e rastreamento

Para facilitar a validação, recomenda-se:

- Manter o nome da tarefa semelhante ao nome do componente/arquivo
- Usar comentários de rastreio:

```tsx
// Tarefa: reconhecimento de voz na home
// Origem: PLANEJAMENTO_SEMANA_ATUAL.md
```

---

## 🧠 Uso com IA

A IA local pode:
- Sugerir se a tarefa está realmente implementada com base no código lido
- Apontar funções não utilizadas ou componentes órfãos
- Identificar gaps (ex: a tela foi criada, mas não tem navegação para ela)

---

## 📦 Exemplo prático

### Tarefa no `MCP_STATUS.md`:
> [ ] Implementar botão de voz na tela principal

### Validação real:
- Arquivo: `src/screens/HomeScreen.tsx`
- Código:
```tsx
<TouchableOpacity onPress={startVoice}>
  <MicIcon />
</TouchableOpacity>
```
- Navegação: `navigate("VoiceInputScreen")`
- Resultado: ✅ tarefa pode ser marcada como feita

---

Esse guia é essencial para manter a **disciplina técnica e confiabilidade do progresso** no app Economizae.