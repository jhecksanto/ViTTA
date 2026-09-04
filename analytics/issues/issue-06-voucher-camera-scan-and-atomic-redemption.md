# Issue 06: Resgate Atômico de Vouchers e Tratamento do Scanner de Câmera
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Clube de Vouchers / Conveniados  
**Componente Principal:** `src/components/Conveniado/VoucherValidationView.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
O leitor de QR Code para validação de cupons/vouchers por parceiros conveniados necessita de tratamento de erros amigável para permissões de câmera em navegadores e dispositivos móveis, e a validação do cupom deve ser atômica (`runTransaction`) para prevenir resgates simultâneos fraudulentos.

---

## 2. Tarefas de Implementação
- [ ] Tratar exceções de bloqueio de câmera (`NotAllowedError`, `NotFoundError`) com exibição de alerta claro e opção de alternar para validação por código manual.
- [ ] Envolver o processo de resgate em transação do Firestore (`runTransaction`), garantindo que o status `active` seja alterado para `used` de forma única e atômica.
- [ ] Exibir modal de confirmação de validação de voucher com percentual/valor do desconto aplicado e detalhes da oferta.

---

## 3. Critérios de Aceite
1. Se a câmera estiver bloqueada, o parceiro recebe instrução amigável e campo de digitação manual acessível.
2. É impossível resgatar o mesmo voucher duas vezes, mesmo com múltiplos cliques rápidos.
3. O parceiro visualiza o comprovante de resgate imediato após validar com sucesso.
