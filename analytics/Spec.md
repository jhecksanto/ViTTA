# Especificação Técnica de Telemedicina (Spec.md)
**Data e Hora de Geração:** 15 de junho de 2026, 20:03:29 (Horário de Brasília)

---

Este documento traz a especificação de software detalhada sobre o que falta para completar a implementação de telemedicina no sistema Vitta, focando em segurança de link único, verificação do ciclo de vida em tempo real e redirecionamentos.

---

## 🧭 1. Comportamentos de Sistema (Behaviors)

### B1: Deep-Linking e Auto-Detecção da Sala na Inicialização
* **Objetivo:** Permitir que o link único enviado a um paciente, médico ou convidado abra diretamente a sala se o link for válido.
* **Gatilho:** No carregamento global do `App.tsx` (ex: `useEffect` principal).
* **Fluxo:**
  1. Extrair o parâmetro `room` da URL atual (`new URLSearchParams(window.location.search).get('room')`).
  2. Se existor o parâmetro `room`:
     * Buscar no Firestore o documento relacionado no caminho `appointments/{room}`.
     * Caso não encontre, remover o parâmetro da URL e mostrar alerta de "Atendimento não localizado".
     * Caso o documento seja encontrado, verificar as credenciais/sessão atual do usuário:
       * Se o usuário logado for o médico principal (`professionalId === uid`) ou o paciente (`userId === uid`), carregar o `activeTelemedicineApt`.
       * Se o usuário não estiver logado, redirecioná-lo para uma tela especial de acesso/login de telemedicina simplificado.
     * Certificar que se o status da consulta for `completed`, a sala não deve sequer tentar inicializar fluxo de câmera.

### B2: Geração Automática do Link Único no Agendamento
* **Objetivo:** Adicionar metadados de acesso de telemedicina a cada nova consulta online realizada.
* **Fluxo:**
  * Nas funções de criação de consulta (`handleCreate` ou agendamentos via calendário do profissional e área do paciente), quando `modality === 'telemedicine'`.
  * Gerar um código único `telemedicineRoomId` (ex: combinação de hash aleatória e ID do agendamento).
  * Salvar no documento do Firestore o campo `telemedicineRoomId` e salvar `telemedicineUrl` completo (ex: `${window.location.origin}/?room=${id}`).

### B3: Lógica de Invalidação no Encerramento
* **Objetivo:** Garantir que o link do vídeo de transmissão expire imediatamente quando a consulta for concluída.
* **Fluxo:**
  * No momento em que o médico clica em "Desconectar e Finalizar":
    * Atualizar `appointments/{id}` com `status = 'completed'` e registrar a data/hora de finalização.
    * No componente `TelemedicineRoom`, o snapshot síncrono monitorando o agendamento detectará o status mudar para `'completed'` e imediatamente encerrará as transmissões de mídia locais e exibirá uma tela bonita de fechamento.

---

## 🧱 2. Componentes e Telas (Pages & Components)

### C1: Tela Especial "Sessão Finalizada ou Link Expirado" (Componente Visual)
* Onde se localiza: Integração direta no componente `TelemedicineRoom` ou visualização correspondente.
* **Interface Visual:**
  * Um card limpo em fundo escuro com mensagem clara de encerramento.
  * *Exibição:* *"Esta transmissão de telemedicina foi encerrada com sucesso pelo profissional de saúde. Agradecemos por utilizar os serviços Vitta."*
  * Botão de redirecionamento do paciente de volta para a sua visualização de ordens acadêmicas/histórico clínico, e o médico de volta para sua agenda do dia.

### C2: Botão e Badge de "Copiar Link Único de Transmissão"
* Onde se localiza: Painel do Profissional (agendas e consultas de hoje) e Painel do Paciente (cards de próximas consultas).
* **Visual:**
  * Botão simples de "Copiar Link" ou "Compartilhar Transmissão" com ícone de link/cadeado.
  * Copia direto a URL formatada por deep-link no clipboard do usuário de forma segura.

### C3: Modal de Entrada de Convidado (Caso não-autenticado)
* Onde se localiza: Exibição no roteamento de deep-linking quando o usuário acessa um link ativo mas não está logado.
* **Visual:**
  * Solicita o nome/documento identificador e autenticação rápida para assegurar que apenas usuários autorizados interajam na chamada.

---
