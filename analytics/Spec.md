# Especificação Técnica de Telemedicina - Pendências de Finalização (Spec.md)
**Data e Hora de Geração:** 16 de junho de 2026, 11:03:00 (Horário de Brasília)

---

Este documento atua como especificação de referência de engenharia de software para mapear de forma rigorosa os comportamentos, fluxos lógicos e ajustes de componentes que restam refinar no sistema de videoconferência de telemedicina do **Vitta**, baseando-se estritamente nas arestas descritas no relatório de análise diagnóstica.

---

## 🧭 1. Requisitos de Comportamento (Behaviors)

### ⚙️ B1: Desligamento Instantâneo de Dispositivos na Inicialização da Tela de Fechamento
- **Componente Alvo**: `TelemedicineRoom.tsx`
- **Descrição de Comportamento**: No momento em que a sessão é determinada como encerrada (seja por clique no botão de hang up ou detecção reativa via `onSnapshot` de que o `status` da consulta mudou para `completed` ou `cancelled` no Firestore):
  1. O sistema deve **interromper imediatamente todas as faixas ativas** de gravação de mídia local (`localStream.getTracks().forEach(t => t.stop())`) e forçar a redefinição do estado `localStream` para `null`.
  2. Este desligamento deve ocorrer na fração de milissegundo em que `isSessionClosed` passa a ser `true`, garantindo que o indicador de controle de hardware câmera/microfone (luz LED física de funcionamento do dispositivo) cesse imediatamente na abertura do painel de contagem de redirecionamento de 2.5 segundos.

### ⚙️ B2: Garantia Antimemory-Leak de Ouvintes de Interação Global (Autoplay Bypass Listener)
- **Componente Alvo**: `TelemedicineRoom.tsx`
- **Descrição de Comportamento**: O fluxo de contorno para políticas rígidas de autoplay do navegador se dá através de um listener global acoplado à janela (`window.addEventListener('click', unlockAutoplay)`).
  1. A especificação técnica requer a revisão e reforço para assegurar que **todas** as referências dessas escutas sejam totalmente liberadas tanto no retorno da função do hook de efeito de montagem quanto em quaisquer alterações estruturais das dependências das streams de mídia de vídeo ativo, prevenindo acúmulo de processamento excedente.

---

## 🧱 2. Requisitos de Componentes e Interface (Components & Layout)

### 📱 C1: Refinamento Responsivo Bento Grid e Footer para Telas Ultra-Estreitas (< 360px)
- **Componente Alvo**: `TelemedicineRoom.tsx` (Footer de Controles e Grid Visual)
- **Descrição**: Em smartphones com largura de tela menor ou igual a 360px (por exemplo, iPhone SE de primeira geração e displays compactos visualizados via emulador de viewport):
  1. O distanciamento interno da barra de controle flutuante inferior (`footer`), que atualmente divide espaço em layouts amplos, deve se adaptar reduzindo dinamicamente as lacunas horizontais (`gap`) e margens laterais de preenchimento (`gap-2 sm:gap-6 px-2 sm:px-10`).
  2. Reduzir as dimensões dos botões para manter a largura sem transbordar horizontalmente das dimensões da janela visual, assegurando que o botão de mudo e câmera mantenham altura/largura confortáveis de no máximo `w-10 h-10` para preservar a área de tátil (mínimo de 44px conforme diretrizes de usabilidade móvel) sem comprometer o layout geral.
  3. No painel lateral do chat Drawer, o título e as abas de seleção do workspace clínico profissional (receitas, prontuário, atestados) devem compactar seus tamanhos de fonte de forma a não forçar quebras ou empilhamentos verticais anômalos que cubram elementos de digitação em telas de altura e largura limitadas.
