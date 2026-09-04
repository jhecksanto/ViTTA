# Plano Estratégico de Execução das Issues de Finalização (plan.md)
**Data e Hora de Geração:** 04/09/2026 às 15:34 (Horário de Brasília - UTC-3)  
**Objetivo:** Roteiro sequencial de planejamento técnico para a execução ordenada e sem riscos de regressão das 10 issues mapeadas na pasta `/analytics/issues/`.

---

## 1. Visão Geral das Fases de Execução

```
+-----------------------------------------------------------------------------------+
| FASE 1: NÚCLEO CLÍNICO & TELEMEDICINA (Issues 01, 02, 07)                         |
| • Telemedicina (Screen share, Anexos no Chat, Encerramento e Parâmetro ?room=ID)  |
| • Receitas Médicas no Histórico do Paciente (Visualização e Download de PDF)      |
| • Exames Anexados Integrados ao Prontuário SOAP                                   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| FASE 2: GESTÃO DE AGENDAMENTOS & BENEFÍCIOS (Issues 03, 05, 06)                   |
| • Normalização de Modalidade de Atendimento e Persistência de IDs Duplos          |
| • Ciclo de Expiração de Assinaturas e Cancelamento Programado                     |
| • Scanner de Câmera de Vouchers e Validação Atômica anti-duplicidade              |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| FASE 3: OPERAÇÕES FINANCEIRAS & SUPORTE (Issues 04, 08)                           |
| • Validação Regex de Chaves Pix e Comprovante de Liquidação Bancária              |
| • Auto-Scroll no Chat de Suporte e Contador de Mensagens Não Lidas em Tempo Real  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| FASE 4: SEGURANÇA, MODERAÇÃO & RESILIÊNCIA OFFLINE (Issues 09, 10)                |
| • Cooldown no Reenvio de 2FA e Notificações Instantâneas de Moderação KYC         |
| • Auto-Sincronização Idempotente da Fila Offline no Evento de Conexão             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Detalhamento das Etapas de Implementação

### Fase 1: Núcleo Clínico & Telemedicina
- [ ] **Etapa 1.1 (Issue 01 - Telemedicina WebRTC):**
  - Ajustar `src/components/TelemedicineRoom.tsx` para implementar o método `replaceTrack` do WebRTC durante o compartilhamento de tela com restauração via `onended`.
  - Habilitar envio de anexos no chat interno da sala via Firebase Storage.
  - Sincronizar encerramento do atendimento médico com reset de flags e acionamento do `ReviewModal` no paciente.
  - Tratar o parâmetro `?room=ID` em `src/App.tsx` com limpeza no encerramento (`history.replaceState`).
- [ ] **Etapa 1.2 (Issue 02 - Receitas Médicas do Paciente):**
  - Vincular botão de abertura do `PatientPrescriptionModal.tsx` nos cards de consultas concluídas em `MyAppointmentsView.tsx`.
  - Validar a exportação do PDF da receita com carimbo e assinatura médica.
- [ ] **Etapa 1.3 (Issue 07 - Exames no Prontuário SOAP):**
  - Adicionar aba "Exames Anexados do Paciente" no `SOAPConsultationModal.tsx` para consulta rápida durante o atendimento.
  - Adicionar indicador de progresso no upload de exames em `PatientExamsView.tsx`.

---

### Fase 2: Gestão de Agendamentos & Benefícios
- [ ] **Etapa 2.1 (Issue 03 - Agendamentos & IDs Duplos):**
  - Criar helper `isTelemedicineModality` e padronizar checagens nos componentes de agendamento.
  - Garantir a gravação simultânea de `userId`/`patientId` e `professionalUserId`/`professionalId`.
  - Implementar regra de estorno automático em cancelamentos antecipados.
- [ ] **Etapa 2.2 (Issue 05 - Assinaturas & Planos):**
  - Implementar verificação de expiração de assinatura comparando com `currentPeriodEnd`.
  - Configurar cancelamento programado mantendo o acesso até o fim do ciclo pago.
- [ ] **Etapa 2.3 (Issue 06 - Vouchers & Leitor de QR Code):**
  - Adicionar tratamento de permissões de câmera em `VoucherValidationView.tsx` com fallback manual.
  - Proteger a validação do voucher com `runTransaction` no Firestore contra uso duplicado.

---

### Fase 3: Operações Financeiras & Suporte
- [ ] **Etapa 3.1 (Issue 04 - Validação Pix & Comprovantes):**
  - Adicionar validação regex para tipos de chave Pix (CPF, CNPJ, E-mail, Telefone, Chave Aleatória EVP) em `ProfessionalFinanceView.tsx`.
  - Integrar exibição do comprovante bancário com código E2E para o profissional.
- [ ] **Etapa 3.2 (Issue 08 - Chat de Suporte):**
  - Implementar auto-scroll suave em `SupportChat.tsx` e sincronização do badge de não lidas no menu do administrador.

---

### Fase 4: Segurança, Moderação & Resiliência Offline
- [ ] **Etapa 4.1 (Issue 09 - 2FA & KYC):**
  - Adicionar temporizador regressivo de 60 segundos no botão de reenvio de código 2FA.
  - Disparar notificação in-app ao aprovar ou reprovar documentos no `AdminKYCModerationView.tsx`.
- [ ] **Etapa 4.2 (Issue 10 - Fila Offline):**
  - Configurar listener do evento `online` em `src/lib/offlineQueue.ts` para sincronização automática imediata ao restabelecer a conexão.

---

## 3. Diretrizes de Validação & Não-Regressão
1. **Compilação Contínua:** Executar `lint_applet` e `compile_applet` após cada bloco de tarefas para garantir 100% de integridade no build.
2. **Preservação de Dados:** Todas as operações no Firestore devem utilizar `serverTimestamp()` e manter retrocompatibilidade com documentos legados.
3. **Escopo Estrito:** Nenhuma funcionalidade além das 10 issues planejadas deve ser introduzida.
