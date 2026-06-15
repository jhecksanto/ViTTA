# Issue #3: Ciclo de Vida da Telemedicina, Invalidação e Expiração do Link
**Data e Hora de Geração:** 15 de junho de 2026, 20:03:29 (Horário de Brasília)

---

## 📌 Descrição
Criar controle rígido do ciclo de vida da sala de transmissão no componente `TelemedicineRoom.tsx`. Quando o médico finaliza o atendimento, o link é desativado e expira imediatamente para que ninguém continue acessando a chamada ou consumindo banda desnecessariamente.

## 🛠 Requisitos de Implementação
1. **Proteção Reativa com Snapshots:**
   * Adicionar no componente `TelemedicineRoom` a reflexão imediata sobre alterações de status da consulta no Firestore.
   * Se o listener em tempo real no Firestore ler `status === 'completed'` ou `status === 'cancelled'`:
     * Pausar os streams e faixas de vídeo e áudio locais imediatamente via `track.stop()`.
     * Alterar o estado local para uma flag `isSessionClosed = true`.

2. **Interface de Conclusão / Tela de Encerramento:**
   * Caso `isSessionClosed` seja verdadeiro, congelar a visualização da tela de transmissão e renderizar no lugar uma UI amigável e clean de encerramento em tela cheia:
     * Título principal: *"Atendimento de Telemedicina Encerrado"*.
     * Mensagem secundária explicativa: *"Esta consulta por vídeo foi finalizada com sucesso pelo médico profissional responsável. O prontuário e as receitas médicas já estão devidamente integrados ao seu perfil."*
     * Botão com ícone para sair dali, disparando a rotina `onLeave()` e enviando o usuário de volta com segurança para seu dashboard.

3. **Verificação Antecipada:**
   * Caso o paciente clique em entrar em uma consulta cujo status já está marcado como `completed` ou `cancelled`, exibir a tela de expiração/bloqueio antes de inicializar permissão de câmera.

## ✅ Critérios de Aceite
- Quando o doutor clica em "Desconectar e Finalizar", a consulta deve mudar o status no Firestore para `completed` e o paciente tem o vídeo encerrado imediatamente na tela dele de forma reativa.
- Qualquer pessoa re-acessando o link daquela sala finalizada receberá a tela especial comunicando que a sessão já expirou e não terá acesso ao chat ou aos fluxos WebRTC.
---
