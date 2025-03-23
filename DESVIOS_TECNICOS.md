# 🔀 DESVIOS_TECNICOS.md

Este arquivo registra decisões técnicas ou implementações realizadas **fora do planejamento original** do projeto.  
Cada entrada deve conter justificativa, impacto e conexão com os arquivos do MCP.

---

## 📅 09/04/2025

### 🎨 Animação de entrada na tela Home
- **Status:** Implementado
- **Origem:** não previsto em `guia-futuro.md`
- **Motivo:** IA sugeriu que uma transição visual ajudaria na retenção do usuário
- **Impacto:** adicionada biblioteca `react-native-reanimated`
- **Validação:** código presente no `HomeScreen.tsx`

---

## 📅 10/04/2025

### 🧠 Adição de comando “usar ia resumir status”
- **Status:** Implementado
- **Origem:** sugestão não documentada inicialmente
- **Motivo:** facilitar navegação técnica para novos devs
- **Impacto:** IA agora resume `MCP_STATUS.md` sob demanda
- **Rastreio:** `guia-uso-mcp.md` foi atualizado

---

Este arquivo é fundamental para **entender desvios, documentar exceções** e garantir rastreabilidade mesmo fora da linha do planejamento.