# Issue 1: Interrupção Instantânea de Mídia Física no Fechamento
**Data e Hora de Geração:** 27 de junho de 2026, 21:49:18 (Horário de Brasília)

---

## 📌 Contexto
Quando a sessão de telemedicina é finalizada (ou pelo botão de desligar ou remotamente pela mudança de status da consulta no Firestore), uma tela de fechamento com contagem regressiva de 2.5 segundos é exibida. No entanto, o hardware de câmera/microfone (especialmente a luz LED de atividade física do dispositivo) deve ser desligado imediatamente no primeiro milissegundo de encerramento, e não após os 2.5 segundos, garantindo a privacidade do usuário.

## 🎯 Requisitos
1. **Gatilho de Desligamento Síncrono**: Monitorar a mudança do estado `isSessionClosed` para `true` ou a mudança de status da consulta.
2. **Parada das Faixas de Mídia**: Obter o stream local ativo (`localStream`) e percorrer as faixas chamando `.stop()` em cada uma:
   ```typescript
   localStream.getTracks().forEach(track => {
     track.stop();
   });
   ```
3. **Redefinição de Estado**: Definir o estado do `localStream` para `null` de forma imediata para impedir qualquer tentativa de re-acesso tardio.
4. **Resiliência**: Garantir que se a stream for nula, o código trate sem lançar exceções.

## 🔧 Componente Alvo
- `/src/components/TelemedicineRoom.tsx`
