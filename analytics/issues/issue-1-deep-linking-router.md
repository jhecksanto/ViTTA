# Issue #1: Roteamento de Deep-linking e Auto-detecção de Sala
**Data e Hora de Geração:** 15 de junho de 2026, 20:03:29 (Horário de Brasília)

---

## 📌 Descrição
Implementar a detecção na inicialização global do app para interceptar conexões que venham com o parâmetro `?room=XYZ` de telemedicina na query string. É fundamental para dar suporte a links diretos e compartilhamento prático.

## 🛠 Requisitos de Implementação
1. **Interceptador de URL:**
   * No `useEffect` principal da raiz do `App.tsx` (ou logo após a inicialização da autenticação e dados do usuário), capturar o parâmetro `room`.
   ```ts
   const roomParam = new URLSearchParams(window.location.search).get('room');
   ```

2. **Validação no Firestore:**
   * Caso o parâmetro seja econtrado, realizar a consulta ao documento: `doc(db, 'appointments', roomParam)`.
   * Verificar se o agendamento existe, carregar as informações em memória e verificar se a sessão de telemedicina é válida.

3. **Restrições de Transição de Estado:**
   * Se o usuário logado for de fato o médico ou o paciente respectivo ao documento, mudar a aba ativa para telemedicina, atribuindo e ativando o componente através do estado `setActiveTelemedicineApt(appointment)`.
   * Remover o parâmetro da URL de forma segura sem recarregar o browser usando a History API:
   ```ts
   window.history.replaceState({}, document.title, window.location.pathname);
   ```

## ✅ Critérios de Aceite
- Ao digitar um link com `?room=VALID_ID`, se o participante estiver logado e autorizado, ele deve ser levado direto para a interface de vídeo da consulta.
- Se o agendamento não for válido ou inexistente, um toast informativo amigável deve alertar a impossibilidade de login.
- O parâmetro deve sumir da URL após o processamento para limpeza visual.
