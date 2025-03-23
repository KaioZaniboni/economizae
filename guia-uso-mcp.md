# 🧠 Guia de Uso do MCP com o Cursor

Este guia mostra como utilizar o sistema MCP (Model Context Protocol) para interagir com a IA local, manter o controle técnico do projeto e automatizar tarefas diretamente no Cursor.

---

## ⚙️ Como o MCP funciona

O MCP é um servidor local (FastAPI) que:
- Processa comandos técnicos enviados via Cursor
- Marca tarefas como feitas ou em andamento
- Atualiza o histórico do projeto
- Valida a presença de código real
- Se comunica com IA local via Ollama

---

## 🧪 Como rodar o servidor

```bash
python mcp_server.py
```

> Ele ficará disponível em `http://localhost:8000/mcp`

---

## 💬 Como usar no Cursor

Você precisa do arquivo `.cursor/mcp.json` com o conteúdo:

```json
{
  "servers": [
    {
      "name": "MCP Economizae",
      "url": "http://localhost:8000/mcp",
      "description": "Servidor técnico local com IA e rastreamento"
    }
  ]
}
```

Depois, no chat do Cursor, você pode digitar comandos como:

---

## 📋 Comandos disponíveis

### ✅ Marcar tarefa como feita
```txt
marcar tarefa botão de voz na home como feita
```
> O MCP irá:
- Marcar a tarefa no `MCP_STATUS.md`
- Validar se há código correspondente
- Registrar no `STATUS_HISTORY.md`

---

### 🧠 Usar IA local
```txt
usar ia gere ideias para gamificação do app
usar ia resuma o MCP_STATUS.md
```
> Envia o prompt para o modelo Mistral (ou outro) via Ollama local

---

### 📊 Status da sprint
```txt
qual o status da semana?
o que falta fazer?
```
> MCP lê o `PLANEJAMENTO_SEMANA_ATUAL.md` e responde com um resumo da sprint

---

### 🔍 Verificar tarefa
```txt
essa tarefa já foi feita: botão de adicionar produto?
```
> Verifica se a tarefa está marcada e se há código correspondente

---

### 📅 Histórico de progresso
```txt
me mostre o histórico de alterações da semana
```
> MCP retorna blocos do `STATUS_HISTORY.md`

---

## 🧩 Boas práticas

- Nomeie as tarefas com clareza
- Mantenha os arquivos de status sempre versionados
- Use comandos curtos e diretos no Cursor
- Permita que a IA ajude com ideias e sugestões de planejamento

---

## 💡 Dica: use com o `VISAO_GERAL.md`

Referencie sempre os arquivos como:
> “Sugira algo com base no guia-futuro.md”  
> “Compare o que está no planejamento com MCP_STATUS.md”

---

Este guia é lido e seguido pelo Cursor + IA para manter o projeto sob controle e com rastreamento técnico real.