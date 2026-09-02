# Issue 01: Regras de Segurança do Firestore para Subcoleções WebRTC, Chat e Documentos Clínicos
**Data e Hora de Atualização:** 02/09/2026 às 20:33 (Horário de Brasília - UTC-3)  
**Status:** Concluída  
**Escopo:** Telemedicina / Infraestrutura de Dados e Segurança

---

## 1. Contexto e Problema
O arquivo `firestore.rules` possuía regras para o documento raiz `appointments/{appointmentId}`, mas não cobria as subcoleções geradas durante uma teleconsulta (`webrtc/signal`, `doctorCandidates`, `patientCandidates` e `messages`). Além disso, as coleções de saída médica `patient_records` e `prescriptions` não possuíam declaração explícita de leitura e escrita.

---

## 2. Escopo de Alteração Realizado
* **Arquivo Alvo:** `firestore.rules`
* Adicionadas regras para subcoleções WebRTC/Chat sob `appointments/{appointmentId}`.
* Adicionadas regras para coleções de prontuário e receitas digitais (`patient_records` e `prescriptions`).
* Regras validadas e publicadas via `deploy_firebase`.

---

## 3. Critérios de Aceite
- [x] Regras compilam sem erro de sintaxe.
- [x] Conexão WebRTC realiza leitura e escrita de SDP e candidatos ICE sem erros de permissão.
- [x] Chat da telemedicina permite troca de mensagens em tempo real entre médico e paciente.
- [x] Prontuários e prescrições são gravados e lidos com sucesso pelos seus respectivos donos.
