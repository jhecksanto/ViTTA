# Issue 10: Suporte - Rolagem Suave Automática e Badges de Mensagens Não Lidas
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Suporte & Atendimento ao Cliente  
**Prioridade:** P2 (Média)  
**Arquivos Alvo:** `src/components/SupportChat.tsx`, `src/components/Admin/AdminSupportChatView.tsx`, `src/App.tsx`

---

## 1. Descrição e Contexto
Nos componentes de chat de suporte ao usuário (`SupportChat.tsx` e `AdminSupportChatView.tsx`), a chegada de novas mensagens em tempo real deve posicionar a rolagem automaticamente na mensagem mais recente. Além disso, quando o administrador ou o paciente estiver com o chat minimizado, o ícone de suporte no menu superior/lateral deve exibir o número de mensagens pendentes de leitura.

---

## 2. Requisitos Técnicos
1. **Auto-Scroll no Chat:**
   - Adicionar `messagesEndRef = useRef<HTMLDivElement>(null)` no container de mensagens.
   - Em todo disparo do listener `onSnapshot` que atualizar a lista de mensagens, executar `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })`.
2. **Contador de Mensagens Não Lidas:**
   - No Firestore, manter o campo `unreadCount` ou `read: false` nas mensagens.
   - Atualizar dinamicamente o badge de notificações no menu principal do applet quando houver mensagens destinadas ao usuário logado não lidas.
   - Ao abrir o chat, marcar as mensagens como lidas (`read: true`).

---

## 3. Critérios de Aceite
- [ ] Novas mensagens fazem o scroll descer suavemente até o final.
- [ ] Badge numérico exibe a quantidade exata de mensagens não lidas e zera ao abrir o chat.
