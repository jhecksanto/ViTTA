# Issue 03: Amostragem e Consumo do Acervo de Vouchers de Recompensas (Vitta Coins)
**ID:** `issue-03-vittacoins-voucher-view`  
**Prioridade:** Média  
**Status:** Pronto para Planejamento  

---

## 1. Descrição do Problema
O sistema completo de pontuação, ganho de Vitta Coins, deduções financeiras e compras de vouchers parceiros de premiação por moedas já está perfeitamente funcional na aba `WalletsView` (Carteira e Recompensas). No entanto, quando o associado usa suas moedas para trocar por um voucher (como a consulta gratuita ou desconto em exames), o voucher fica armazenado na coleção `user_vouchers` sob o status `active`, mas o usuário não consegue visualizá-lo ou consumi-lo de forma coerente nos canais normais do aplicativo (como na aba de Vouchers ou Benefícios ativos).

---

## 2. Abordagem / Planejamento Técnico Detalhado

### A. Integração de Visualização na Área de Benefícios Ativos (`BenefitsView` ou similar)
1. Pesquisar onde os "Meus Vouchers" comprados por dinheiro ou carregados do plano de saúde são exibidos.
2. Garantir que a query que escuta ou lê os cupons do usuário (`colection(db, 'user_vouchers')`) seja comum e filtre corretamente tanto os vouchers tradicionais quanto os vouchers de moedas (`isRedeemedReward: true`).
3. Ao listar as ofertas de recompensa resgatadas na carteira ou área de vouchers, exibir um design card especial com bordas cintilantes ou cor âmbar para simbolizar que foi obtido por fidelidade (Vitta Coins), adicionando a descrição em destaque e o código simulado do QR Code de ativação.

### B. Funcionalidade de Resgate Coerente (Simulação de Uso)
1. Permitir que o usuário clique em um botão **"Ativar / Usar Voucher"** no modal do respectivo prêmio.
2. Ao usar o cupom:
   - Alterar no Firestore o status de `status: 'active'` para `'redeemed'`.
   - Gerar um toast de parabéns amigável com instruções de uso e mostrar um estado visual condicional ("Utilizado em DD/MM/AAAA").

---

## 3. Critérios de Aceitação
- [ ] O usuário resgata uma recompensa e este prêmio aparece instantaneamente na lista unificada de "Meus Cupons" ou "Benefícios Ativos".
- [ ] O visual do card do voucher no acervo do usuário mostra de forma clara e elegante a tag: `🪙 Recompensa Vitta Coins`.
- [ ] O usuário consegue simular a ativação (consome o voucher), atualizando o status de forma transparente no banco de dados e mudando a visualização para desabilitado / cinza.
