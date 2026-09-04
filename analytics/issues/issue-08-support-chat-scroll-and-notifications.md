# Issue 08: Auto-Scroll do Chat de Suporte e Contador de Não Lidas em Tempo Real
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Suporte & Atendimento Administrativo  
**Componente Principal:** `src/components/SupportChat.tsx`, `src/components/Admin/AdminSupportView.tsx`, `src/App.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
No chat de suporte entre pacientes/profissionais e os atendentes administrativos, é necessário garantir a descida automática e suave da rolagem ao receber novas mensagens e atualizar o contador de mensagens não lidas no badge do menu do administrador em tempo real.

---

## 2. Tarefas de Implementação
- [ ] Implementar auto-scroll suave (`scrollIntoView({ behavior: 'smooth' })`) ao receber novas mensagens na janela de suporte.
- [ ] Integrar listener em tempo real no Firestore para somar conversas com mensagens não respondidas e exibir badge numérico na barra de navegação administrativa.
- [ ] Adicionar botão de encerramento formal de chamado de suporte pelo administrador com registro de finalização.

---

## 3. Critérios de Aceite
1. Novas mensagens no chat de suporte mantêm o foco visual na mensagem mais recente.
2. O administrador visualiza instantaneamente no menu superior quantas mensagens de suporte estão aguardando retorno.
