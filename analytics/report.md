# Relatório de Análise Geral do Sistema - ViTTA Convênios
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Status do Projeto:** Análise Diagnóstica de Finalização das Funções do Menu Lateral  
**Escopo:** Estritamente as funcionalidades já existentes no menu lateral que necessitam de fechamento, estabilização e tratamento de ponta a ponta (sem adição de novas funcionalidades não solicitadas).

---

## 1. Sumário Executivo

A plataforma **ViTTA Convênios** possui uma arquitetura com múltiplos papéis (Admin Master, Profissionais de Saúde, Pacientes/Beneficiários e Estabelecimentos Credenciados). O Menu Lateral recentemente integrado disponibiliza o acesso centralizado a 23 visualizações e submódulos funcionais.

Este relatório documenta um diagnóstico detalhado de **apenas o que resta finalizar** em cada uma dessas páginas e recursos para garantir que todas as ações do menu lateral operem com 100% de consistência, persistência no Firestore, tratamento de erros, validação de regras de negócio e feedback ao usuário.

---

## 2. Diagnóstico Módulo a Módulo do Menu Lateral

### Módulo 1: Administração Master & Ecossistema

#### 1.1 Painel Geral ViTTA (`admin` / `AdminView`)
* **Estado Atual:** Dashboard central com abas de visão geral, usuários, parcerias, profissionais e configurações.
* **O que falta finalizar:**
  1. **Confirmação e exclusão segura de estabelecimentos:** Adicionar diálogo de confirmação com estorno ou encerramento de vouchers vinculados antes de desativar um parceiro.
  2. **Validação em lote de profissionais (KYC):** Fechamento do fluxo de aprovação com envio automático de notificação no Firestore para o médico e gravação de log de auditoria.
  3. **Exportação de métricas:** Finalizar o gerador de relatórios tabulares em CSV para a lista de usuários e credenciados.
  4. **Tratamento de exceções no Firestore:** Garantir bloqueio de estado e feedback visual via Toast em caso de falha de conexão nas alterações de permissão.

#### 1.2 Analytics ViTTA (`admin-analytics` / `AnalyticsView`)
* **Estado Atual:** Métricas gráficas de faturamento, volume de agendamentos e taxas de adesão.
* **O que falta finalizar:**
  1. **Filtro de período dinâmico:** Conectar o seletor de datas (Hoje, 7D, 30D, Este Mês, Personalizado) diretamente às consultas agregadas do Firestore (`transactions` e `appointments`).
  2. **Taxa de conversão real:** Cálculo dinâmico comparando consultas agendadas versus consultas com status `completed` e `cancelled`.
  3. **Estados de carregamento (Skeleton):** Implementar placeholders animados durante o carregamento de grandes volumes de dados.

#### 1.3 Consultas Globais (`admin-appointments` / `AdminAppointmentsView`)
* **Estado Atual:** Listagem de consultas com filtros por status e edição básica de dados.
* **O que falta finalizar:**
  1. **Fluxo de reagendamento pelo Administrador:** Permitir selecionar novo horário com atualização do registro e disparo de notificação síncrona para paciente e profissional.
  2. **Justificativa de cancelamento:** Exigir motivo ao cancelar consulta administrativamente e executar estorno automático de saldo de ViTTA Coins quando aplicável.
  3. **Busca combinada:** Finalizar busca textual unificada por nome do paciente, nome do médico, CRM e ID da consulta.

#### 1.4 Gestão de Carteiras & Saldos (`admin-wallet` / `AdminWalletManagementView`)
* **Estado Atual:** Visualização de saldos de usuários e modal de ajuste/recarga manual.
* **O que falta finalizar:**
  1. **Log de auditoria obrigatório:** Gravar em `audit_logs` toda alteração manual de saldo com identificador do administrador logado, justificativa e valor anterior/novo.
  2. **Bloqueio preventivo de carteira:** Adicionar toggle para congelar movimentações de carteiras com pendência de KYC ou suspeita de fraude.
  3. **Extrato detalhado no modal:** Exibir histórico das últimas 10 transações do usuário selecionado dentro do modal de detalhes.

#### 1.5 Planos de Assinatura (`admin-subscriptions` / `SubscriptionManagementView`)
* **Estado Atual:** Formulário de criação, edição e ativação de planos de convênio.
* **O que falta finalizar:**
  1. **Bloqueio de exclusão de planos com assinantes:** Validar no Firestore se existem usuários com `planId` ativo antes de permitir exclusão, oferecendo opção de migração.
  2. **Cálculo real de MRR:** Contabilizar a receita recorrente baseada na contagem real de usuários ativos vinculados a cada plano.
  3. **Listagem de membros do plano:** Modal ou drawer exibindo os conveniados vinculados ao plano selecionado.

#### 1.6 Gestão Financeira & Split (`admin-financial` / `AdminFinancialView`)
* **Estado Atual:** Extrato de transações gerais e fila de solicitações de saque Pix dos médicos.
* **O que falta finalizar:**
  1. **Processamento e comprovante de saque:** Ao aprovar um saque Pix, anexar código de liquidação bancária/comprovante e atualizar saldo pendente do profissional.
  2. **Discriminação de Split:** Exibir claramente a retenção da taxa ViTTA versus o valor líquido repassado ao prestador em cada linha de consulta.
  3. **Filtro avançado por tipo:** Segmentar o extrato por Recargas, Consultas, Mensalidades, Estornos e Saques.

#### 1.7 Gestão de Vouchers (`admin-vouchers` / `AdminVoucherManagementView`)
* **Estado Atual:** Criação de campanhas de vouchers e listagem de cupons emitidos.
* **O que falta finalizar:**
  1. **Validador/Scanner manual de vouchers:** Tela de conferência e baixa imediata de voucher pelo parceiro ou admin através de digitação ou leitor de código.
  2. **Regras de limite de uso:** Controle estrito de resgates únicos por CPF e expiração automática de vouchers vencidos.
  3. **Métrica de conversão:** Totalizadores de economia gerada aos pacientes e faturamento direcionado aos parceiros credenciados.

#### 1.8 Configurações de Liberais & Taxas (`admin-liberal-config` / `AdminLiberalConfigView`)
* **Estado Atual:** Configuração de taxas de comissão e repasse por categoria médica.
* **O que falta finalizar:**
  1. **Simulador de split dinâmico:** Ferramenta interativa para simular o repasse líquido antes de gravar a nova tabela de comissões.
  2. **Histórico de vigência:** Gravação de logs de alteração de percentuais com data e admin responsável.

#### 1.9 Auditoria & Logs de Segurança (`admin-audit` / `AuditLogsList`)
* **Estado Atual:** Lista de eventos gravados em `audit_logs` com filtros por severidade.
* **O que falta finalizar:**
  1. **Visualizador de Diff / Payload:** Drawer para inspecionar os dados JSON completos do evento (estado anterior vs novo estado).
  2. **Exportação de Logs:** Download de relatório em CSV/JSON para conformidade e segurança da informação.
  3. **Filtro por ator:** Busca rápida por UID ou e-mail do autor da ação.

#### 1.10 Central de Atendimento Admin (`admin-chat` / `AdminSupportChatView`)
* **Estado Atual:** Painel de chat em tempo real com lista de usuários e fila de conversas.
* **O que falta finalizar:**
  1. **Finalização formal de chamado:** Botão para encerrar o ticket com status `resolved` e registro de nota de encerramento.
  2. **Templates de respostas rápidas:** Menu de mensagens prontas para dúvidas frequentes de suporte.
  3. **Alerta sonoro/visual:** Notificação na interface quando uma nova mensagem chegar em conversas minimizadas.

---

### Módulo 2: Módulo Clínico & Médico

#### 2.1 Dashboard Clínico (`professional-dashboard` / `ProfessionalDashboardView`)
* **Estado Atual:** Atendimentos do dia, Prontuário Eletrônico (SOAP), histórico de pacientes e acesso à telemedicina.
* **O que falta finalizar:**
  1. **Geração e Impressão de Prescrição Médica Digital:** Exportação de atestado, receita médica e pedido de exames em layout padronizado com cabeçalho, CRM e assinatura.
  2. **Finalização de atendimento:** Ação síncrona de conclusão da consulta que atualiza o status para `completed`, registra no prontuário e credita o split no saldo do médico.
  3. **Aba de histórico biométrico:** Visualização integrada da evolução de peso, pressão e exames do paciente selecionado diretamente na consulta.

#### 2.2 Minha Agenda & Horários (`professional-agenda` / Agenda View)
* **Estado Atual:** Visão semanal e mensal de horários de consulta.
* **O que falta finalizar:**
  1. **Bloqueio de horários e turnos:** Modal para cadastrar ausências (folgas, congressos, emergências) com checagem de consultas já agendadas e aviso de conflito.
  2. **Configuração de duração de consulta:** Ajuste dinâmico do intervalo entre slots (ex: 15, 30, 45 ou 60 minutos) com recálculo dos horários disponíveis.
  3. **Sincronização com Google Calendar:** Sincronização dos agendamentos diretamente na conta do profissional.

#### 2.3 Finanças & Repasses Médicos (`professional-finance` / `ProfessionalFinanceView`)
* **Estado Atual:** Saldo da carteira, total faturado e modal de solicitação de saque.
* **O que falta finalizar:**
  1. **Máscara e validação de chaves Pix:** Validação estrita de formatos (CPF, CNPJ, E-mail, Celular, EVP) impedindo envio de chave inválida.
  2. **Extrato detalhado por consulta:** Listagem com identificação do paciente, data do atendimento, valor bruto, taxa ViTTA e valor líquido recebido.
  3. **Comprovante de repasse:** Emissão de recibo digital das transferências concluídas.

---

### Módulo 3: Módulo Paciente & Benefícios

#### 3.1 Início & Feed ViTTA (`home` / `HomeView`)
* **Estado Atual:** Banners de novidades, atalhos rápidos e destaques de parceiros.
* **O que falta finalizar:**
  1. **Card de Próxima Consulta:** Alerta em destaque no topo da tela com contagem regressiva e botão de acesso direto à sala de telemedicina ou rota presencial.
  2. **Aviso de Laudos Prontos:** Notificação em banner caso haja novos exames com laudo disponibilizado.
  3. **Navegação por especialidades:** Conectar os chips de especialidades à página de profissionais com filtro pré-aplicado.

#### 3.2 Meu Painel de Saúde (`patient-dashboard` / `PatientDashboardView`)
* **Estado Atual:** Consultas agendadas, carteirinha virtual, gráficos biométricos e saldo de ViTTA Coins.
* **O que falta finalizar:**
  1. **Cancelamento/Reagendamento autônomo:** Permitir que o paciente cancele ou altere a data da sua consulta respeitando o prazo mínimo, com estorno automático de créditos.
  2. **Carteirinha Digital com QR Code dinâmico:** Exibição dos dados do plano, número de matrícula e QR Code para validação presencial nos parceiros.
  3. **Disparo da Avaliação Pós-Consulta:** Integração automática com o `ReviewModal` após a conclusão de uma consulta para coletar nota e comentário.

#### 3.3 Profissionais & Especialistas (`professionals` / `ProfessionalsView`)
* **Estado Atual:** Listagem de especialistas com busca por nome, modalidade e agendamento.
* **O que falta finalizar:**
  1. **Filtro combinado avançado:** Filtro simultâneo por Especialidade, Cidade/Bairro, Modalidade (Presencial/Telemedicina) e Ordenação (Preço/Avaliação).
  2. **Fluxo de pagamento com débito de carteira:** Débito direto do saldo de ViTTA Coins com validação de saldo insuficiente e redirecionamento para recarga.
  3. **Confirmação e calendário:** Tela de sucesso com botão de adicionar ao Google Calendar e atalho para o painel de consultas.

#### 3.4 Rede Credenciada & Parceiros (`partners` / `PartnersView`)
* **Estado Atual:** Lista de farmácias, clínicas, laboratórios e academias conveniadas.
* **O que falta finalizar:**
  1. **Filtro por categoria e localização:** Seleção rápida de farmácias, laboratórios, clínicas odontológicas e busca por bairro/cidade.
  2. **Integração de Contato e Rota:** Botão de rota no Google Maps e link direto para conversa no WhatsApp do parceiro credenciado.
  3. **Instruções de uso do convênio:** Modal com as regras específicas de desconto e apresentação de documento no estabelecimento.

#### 3.5 Ofertas & Descontos Exclusivos (`offers` / `OffersView`)
* **Estado Atual:** Vitrine de cupons de parceiros e aba de "Meus Vouchers".
* **O que falta finalizar:**
  1. **Modal de Apresentação de Voucher:** Exibição do código em destaque com código de barras / QR Code para leitura fácil na tela do celular no momento da compra.
  2. **Gerenciamento de status:** Opção de arquivar vouchers já utilizados ou expirados na aba "Meus Vouchers".
  3. **Compartilhamento rápido:** Botão para copiar código do cupom ou compartilhar detalhes da oferta via WhatsApp.

#### 3.6 Central de Exames & Laudos (`exams` / `ExamsView`)
* **Estado Atual:** Listagem de solicitações de exames e envio de arquivos.
* **O que falta finalizar:**
  1. **Visualizador de Laudos (PDF/Imagem):** Modal embutido para pré-visualização de arquivos de exames anexados sem sair da página.
  2. **Categorização e Filtros de Status:** Filtros organizados por status (Aguardando Coleta, Em Análise, Laudo Disponível) e por tipo de exame.
  3. **Compartilhamento com médico:** Botão para vincular e disponibilizar o laudo no prontuário do médico solicitante.

---

### Módulo 4: Comunicação & Sistema

#### 4.1 Configurações da Conta (`settings` / Settings View)
* **Estado Atual:** Edição de dados cadastrais e tema.
* **O que falta finalizar:**
  1. **Fluxo de alteração de senha:** Atualização segura de senha utilizando o Firebase Auth com confirmação e validação de força.
  2. **Preferências de Notificação:** Toggles persistentes no documento do usuário para recebimento de alertas por E-mail, WhatsApp e Notificações no Navegador.
  3. **Máscaras e Autopreenchimento de CEP:** Formatação automática de CPF, Telefone e integração com API ViaCEP para preenchimento de endereço.

#### 4.2 Central de Notificações (`notifications` / Notifications View)
* **Estado Atual:** Lista de notificações em tempo real.
* **O que falta finalizar:**
  1. **Ações em lote:** Botão para "Marcar todas como lidas" e exclusão de notificações antigas.
  2. **Navegação direta (Deep Linking):** Ao clicar em uma notificação de consulta, redirecionar diretamente para o agendamento; ao clicar em aviso financeiro, ir para a carteira.
  3. **Filtro por categoria:** Segmentar por Agendamentos, Financeiro, Benefícios e Avisos do Sistema.

#### 4.3 Mensagens & Chat (`chat` / `ChatView`)
* **Estado Atual:** Conversa direta com o suporte ViTTA.
* **O que falta finalizar:**
  1. **Status de envio da mensagem:** Indicadores visuais de Enviando, Enviada e Lida com formatação de data/hora.
  2. **Envio por teclado:** Suporte ao envio da mensagem ao pressionar `Enter` e inserção de nova linha com `Shift + Enter`.
  3. **Suporte a anexos:** Envio de imagens ou comprovantes anexados na conversa.

#### 4.4 Central de Suporte & Ajuda (`support` / `SupportView`)
* **Estado Atual:** FAQ estático com perguntas e respostas.
* **O que falta finalizar:**
  1. **Barra de pesquisa inteligente no FAQ:** Busca em tempo real filtrando perguntas e respostas conforme a digitação do usuário.
  2. **Abertura rápida de ticket:** Botão direto para iniciar atendimento no Chat já com o assunto selecionado.
  3. **Horários de atendimento:** Bloco informativo com canais oficiais de contato e horários de suporte.

#### 4.5 Termos & Privacidade (`terms` / `TermsAndPrivacyView`)
* **Estado Atual:** Exibição dos termos de serviço e diretrizes de privacidade.
* **O que falta finalizar:**
  1. **Formulário de Direitos LGPD:** Formulário integrado para solicitação de exclusão/exportação de dados pessoais pelo titular.
  2. **Impressão e Download:** Botão de impressão formatada em PDF dos termos vigentes.
  3. **Histórico de versões:** Identificação da versão atual e data de vigência do documento.

---

## 3. Matriz de Priorização das Finalizações

| Prioridade | Módulo | Itens Críticos de Finalização |
| :--- | :--- | :--- |
| **P0 - Crítica** | Módulo Clínico & Médico | Prescrição médica em PDF, conclusão de consulta com split síncrono e bloqueio de agenda. |
| **P0 - Crítica** | Administração Financeira | Validação de saques Pix com comprovante, log de auditoria de carteira e regras de split. |
| **P0 - Crítica** | Módulo Paciente | Cancelamento/reagendamento autônomo com estorno, débito de ViTTA Coins e avaliação pós-consulta. |
| **P1 - Alta** | Exames & Ofertas | Visualizador de PDF/laudos, scanner/validador de voucher com QR Code e filtros por categoria. |
| **P1 - Alta** | Comunicação & Atendimento | Encerramento de chamados no Admin Chat, deep linking em notificações e busca no FAQ. |
| **P2 - Média** | Sistema & Configurações | Alteração de senha no Firebase Auth, autopreenchimento de CEP e formulário LGPD. |

---

## 4. Conclusão da Análise

Todas as 23 páginas do menu lateral já possuem estrutura visual e rotas ativas. As pendências identificadas não requerem a criação de novos módulos ou páginas, mas sim o **fechamento cirúrgico dos fluxos de dados, validações de negócio, geração de documentos (PDF/Comprovantes), ações de confirmação e persistência íntegra no Firestore**.
