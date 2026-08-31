# Issue 10: Configurações de Conta, Notificações, Chat Paciente, FAQ e LGPD
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Comunicação & Sistema  
**Páginas:** `settings`, `notifications`, `chat` (`ChatView`), `support` (`SupportView`), `terms` (`TermsAndPrivacyView`)

---

## 1. Escopo & Objetivos
Finalizar o fluxo de troca de senha no Firebase Auth, autopreenchimento de CEP, ações em lote na central de notificações, envio por teclado no chat, busca dinâmica no FAQ e formulário de solicitação de direitos LGPD.

## 2. Tarefas Detalhadas
- [ ] **Troca de Senha Segura:** Modal com reautenticação e atualização de senha através do Firebase Auth.
- [ ] **Autopreenchimento de Endereço via CEP:** Consulta automática da API ViaCEP ao digitar 8 dígitos no campo de CEP.
- [ ] **Ações em Lote em Notificações:** Botão "Marcar todas como lidas" e deep linking para as telas correspondentes.
- [ ] **Envio por Teclado no Chat:** Suporte ao envio com `Enter` e quebra de linha com `Shift + Enter`.
- [ ] **Busca em Tempo Real no FAQ:** Filtro dinâmico das dúvidas frequentes conforme o termo digitado.
- [ ] **Formulário de Direitos LGPD:** Modal para solicitação de exportação ou exclusão de dados com registro em `lgpd_requests`.
- [ ] **Impressão dos Termos de Uso:** Botão de impressão formatada em PDF das políticas do sistema.

## 3. Critérios de Aceite
- A troca de senha bloqueia senhas fracas e exige confirmação da senha atual.
- O CEP preenche rua, bairro e cidade instantaneamente.
- O FAQ filtra resultados em tempo real com destaque para os termos encontrados.
- A solicitação de LGPD é gravada com carimbo de data/hora e notifica a administração.
