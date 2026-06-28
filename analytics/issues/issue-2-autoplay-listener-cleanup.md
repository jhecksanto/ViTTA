# Issue 2: Garantia Antimemory-Leak dos Ouvintes Globais (Autoplay Bypass)
**Data e Hora de Geração:** 27 de junho de 2026, 21:49:18 (Horário de Brasília)

---

## 📌 Contexto
Para mitigar restrições de inicialização automática de som pelo navegador (autoplay), o componente cria um ouvinte global na janela (`window.addEventListener('click', unlockAutoplay)`). É imperativo assegurar que esse listener e quaisquer outros listeners adicionados ao `window` sejam completamente limpos na desmontagem ou quando as dependências mudarem.

## 🎯 Requisitos
1. **Remoção Segura de Eventos**: Certificar-se de que a função `unlockAutoplay` está corretamente declarada com escopo estável e que o `removeEventListener` correspondente é chamado na desmontagem do componente (`return () => { window.removeEventListener('click', unlockAutoplay); }`).
2. **Prevenção de Referências Mortas**: Certificar que a desmontagem remova também qualquer referência interna que possa persistir.

## 🔧 Componente Alvo
- `/src/components/TelemedicineRoom.tsx`
