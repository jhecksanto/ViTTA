# Issue 08: Rede Credenciada, Categorias, Vitrine de Ofertas e Validador de Vouchers
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Módulo Paciente & Benefícios  
**Páginas:** `partners` (`PartnersView`), `offers` (`OffersView`), `admin-vouchers` (`AdminVoucherManagementView`)

---

## 1. Escopo & Objetivos
Finalizar os filtros de categorias de parceiros, atalhos de rota no Google Maps e WhatsApp, visualizador de voucher em tela cheia com código de barras/QR Code e validador no balcão do parceiro.

## 2. Tarefas Detalhadas
- [ ] **Filtro por Categorias de Parceiros:** Segmentação rápida por Farmácias, Laboratórios, Odontologia, Academias e Óticas com busca por cidade.
- [ ] **Atalhos de Contato e Rota:** Botão "Como Chegar" com deep link para o Google Maps e botão "WhatsApp" com mensagem inicial configurada.
- [ ] **Visualizador de Voucher em Tela Cheia:** Modal responsivo na aba "Meus Vouchers" com o código alfanumérico e código de barras/QR Code em destaque para leitura no caixa.
- [ ] **Validador de Voucher:** Interface de conferência onde o parceiro ou admin digita o código ou escaneia o QR Code para dar baixa imediata (`status: "redeemed"`).

## 3. Critérios de Aceite
- Paciente consegue exibir o cupom na tela do celular mesmo em condições de baixa luminosidade com código nítido.
- O validador rejeita vouchers expirados ou já utilizados informando a data do resgate anterior.
- Links de WhatsApp abrem a conversa com a farmácia ou clínica credenciada.
