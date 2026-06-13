# Relatório de Análise Geral e Finalização de Requisitos
**Projeto:** ViTTA Convênios (Plataforma de Saúde & Bem-estar)  
**Autor:** Assistente AI Studio  
**Data:** 13 de Junho de 2026  

---

## 1. Introdução
Este relatório apresenta uma análise crítica e pragmática do estado atual do sistema **ViTTA Convênios**. O objetivo é mapear as pontas soltas das funcionalidades já instaladas ou codificadas no repositório, garantindo que o sistema atinja sua maturidade de produção e experiência do usuário (UX) refinada. 

Adotamos a diretriz de **não introduzir nenhuma funcionalidade nova não requisitada**, concentrando os esforços puramente no fechamento cirúrgico de fluxos incompletos e na montagem das passagens funcionais (as conexões entre componentes existentes).

---

## 2. Inventário de Funcionalidades e Status Atual

| Funcionalidade | Implementado | Integrado no Fluxo Principal | Status Técnico |
| :--- | :---: | :---: | :--- |
| **Autenticação, Firebase e Perfis** | Sim | Sim | Estável. Separação de rotas entre Associados, Profissionais e Administração operacional. |
| **Clínica e Consultas (Presenciais)** | Sim | Sim | Completo. Agendamento, remarcação, cancelamento e visualização de prontuários. |
| **Métricas de Saúde e Metas** | Sim | Sim | Funcional no cliente. Conectado ao Firestore para persistência, porém vulnerável a falhas de conexão em tempo real (oficialmente sem tratamento de fila de sync). |
| **Indicação Offline (Banner)** | Sim | Sim | O componente detecta estado de rede com precisão, mas funciona de forma meramente consultiva. Não realiza o rollback ou enfileiramento das operações locais. |
| **Carteiras e Transações Financeiras** | Sim | Sim | Completo para transferências e saques em BRL. |
| **Vitta Coins (Cashback & Prêmios)** | Sim | Sim | Mecanismo de cashback (ganho) e troca (débito) implementado na `WalletsView` sob o Firestore. Vouchers são adicionados ao acervo, mas falta polimento na amostragem e consumo. |
| **Sala de Telemedicina (`TelemedicineRoom`)** | Sim | Não | **Pendente de Integração.** O componente da sala WebRTC/Firestore simulada está 100% pronto na pasta `src/components/`, mas não está conectado ao fluxo visual do `App.tsx` para permitir que o paciente ou o médico entrem na chamada. |

---

## 3. Análise Detalhada das Pontas Soltas (O que falta concluir)

### A. Integração Completa da Telemedicina (`TelemedicineRoom`)
* **O que já temos:** Um componente espetacular, robusto e responsivo em `src/components/TelemedicineRoom.tsx`. Ele possui chat com suporte a envio simulado de exames em PDF, área de prescrições e atestados integrados para o médico que salvam via debounce no Firestore, simulação de tracks locais de câmera e microfone usando a API nativa do navegador (`navigator.mediaDevices.getUserMedia`) e animação visual de ondas sonoras.
* **O que falta:**
  1. Conexão real na visualização de consultas do Paciente (`AppointmentsView` no frontend): exibir botão **"Entrar na Sala"** quando a consulta for de modalidade telemedicina e estiver datada para o dia atual ou em andamento.
  2. Conexão real no painel do Profissional (`ProfessionalDashboardView`): no card do paciente com status agendado, exibir botão de chamada por vídeo para abrir o workspace do médico.
  3. Transição segura de layouts: criação de um estado raiz de controle no `App.tsx` que esconde os menus tradicionais e foca 100% na chamada, restaurando o painel de forma limpa quando o usuário clica em "Sair" ou "Finalizar".

### B. Sincronização em Segundo Plano (Fila Local Offline)
* **O que já temos:** `OfflineIndicatorBanner` sinalizando quando a rede cai e quando volta, com um service worker básico em `/public/sw.js`.
* **O que falta:**
  1. Cria de uma fila de requisições pendentes gravadas no `localStorage` quando o associado altera suas métricas de peso, passos, hidratação ou logs de medicação no modo offline.
  2. Listener de rede eficiente no `App.tsx` que monitora a transição `offline` -> `online`. Ao reestabelecer a conexão, lê a pilha temporária do `localStorage`, executa as chamadas em lote (batch-write) no Firebase e emite um toast de sucesso consolidado.

### C. Polimento de Usabilidade do Vitta Coins e Ativação de Vouchers
* **O que já temos:** Módulo de cashback e resgate totalmente programado na carteira física do paciente.
* **O que falta:**
  1. Polimento de responsividade gráfica e formatações de data nas linhas de transação específicas para Coins.
  2. Integração de exibição: após o associado trocar suas moedas por um cupom de prêmio (ex: *Voucher Consulta Telemedicina* ou *Isenção de Coparticipação em Exame*), este benefício precisa ser listado no acervo ativo de benefícios (vouchers do usuário) de forma transparente para que ele possa utilizar a ativação ou mostrar o QR Code de resgate.

---

## 4. Próximos Passos
Preparamos, de forma aderente às especificações técnicas descritas na sua diretriz, a especificação das issues e seu planejamento técnico detalhado de montagem nos arquivos subsequentes: `analytics/Spec.md` e a quebra estrutural nas subtarefas em `analytics/issues/`.
