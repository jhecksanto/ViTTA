# Issue 3: Desconexão e Limpeza de Analisadores de Áudio (Web Audio API)
**Data e Hora de Geração:** 27 de junho de 2026, 21:49:18 (Horário de Brasília)

---

## 📌 Contexto
Os microfones remotos e locais utilizam a `Web Audio API` com `AudioContext` e `AnalyserNode` para desenhar barras responsivas de espectro de áudio. Na desmontagem do componente ou finalização da chamada, estes fluxos de processamento e contextos de áudio precisam ser completamente limpos para evitar vazamentos de hardware de áudio e loop de execução ativo (`requestAnimationFrame`).

## 🎯 Requisitos
1. **Cancelamento do Loop de Animação**: Armazenar a referência do `requestAnimationFrame` (`animationFrameId`) e garantir a chamada de `cancelAnimationFrame(id)` ao desmontar o componente.
2. **Fechamento do AudioContext**: Invocar `.close()` em qualquer instância ativa de `AudioContext` criada localmente.
3. **Desconexão de Nós**: Desconectar nós de áudio (`source.disconnect()`, `analyser.disconnect()`) para desalocar recursos de memória de áudio síncronos do sistema operacional.

## 🔧 Componente Alvo
- `/src/components/TelemedicineRoom.tsx`
