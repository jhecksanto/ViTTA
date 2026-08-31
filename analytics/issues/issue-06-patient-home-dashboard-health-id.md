# Issue 06: Início, Próxima Consulta, Painel de Saúde e Carteirinha com QR Code
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Módulo Paciente & Benefícios  
**Páginas:** `home` (`HomeView`), `patient-dashboard` (`PatientDashboardView`)

---

## 1. Escopo & Objetivos
Finalizar o card de alerta de próxima consulta com contagem regressiva, cancelamento autônomo com estorno de créditos, carteirinha digital com QR Code e disparo do modal de avaliação pós-consulta.

## 2. Tarefas Detalhadas
- [ ] **Card de Próxima Consulta no Feed:** Card em destaque no topo da tela inicial quando houver consulta nas próximas 48 horas, com atalho direto para a sala de telemedicina ou rota no mapa.
- [ ] **Cancelamento Autônomo com Estorno:** Permitir que o paciente cancele agendamento com até 2h de antecedência e receba estorno imediato em ViTTA Coins caso a consulta tenha sido pré-paga.
- [ ] **Carteirinha Digital com QR Code:** Modal da carteirinha do titular e dependentes com QR Code legível contendo dados do plano e matrícula para validação nos parceiros credenciados.
- [ ] **Disparo de Avaliação Pós-Consulta:** Abrir `ReviewModal` automaticamente no painel do paciente para consultas concluídas que ainda não receberam avaliação.

## 3. Critérios de Aceite
- Paciente com consulta hoje vê o banner de telemedicina e pode entrar na sala com 1 clique.
- Ao cancelar com antecedência, o saldo da carteira do paciente é atualizado em tempo real.
- O QR Code da carteirinha gera dados válidos legíveis por scanners de estabelecimentos parceiros.
- A avaliação pós-consulta grava a nota e o comentário na coleção `reviews` e recalcula a média do médico.
