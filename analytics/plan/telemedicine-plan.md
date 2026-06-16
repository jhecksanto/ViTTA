# Plano de Implementação de Refinamentos de Telemedicina (telemedicine-plan.md)
**Data e Hora de Geração:** 15 de junho de 2026, 21:34:25 (Horário de Brasília)

---

Este plano detalha a pesquisa técnica de engenharia de software e as abordagens e etapas estratégicas necessárias para implementar os refinamentos especificados nas Issues #1, #2 e #3 no sistema de telemedicina **Vitta**. Todo o escopo é estritamente focado em polimento técnica e segurança de recursos, sem adicionar novas funcionalidades externas ao escopo.

---

## 🔬 1. Pesquisa Técnica e Engenharia de Software

### A. Lifecycle de Recursos de Mídia e Web Audio API
- **Problema**: O indicador físico de uso da câmera/microfone (LED) ou alertas do navegador de que a mídia está em uso podem persistir e consumir bateria/sistema após o fechamento da sala.
- **Estratégia**:
  - Interromper manualmente cada faixa de mídia instanciada do objeto `MediaStream`:
    ```ts
    localStream.getTracks().forEach((track) => {
      if (track.readyState === "live") {
        track.stop();
      }
    });
    ```
  - Fechar formalmente a instância do `AudioContext` do analisador visual do microfone em tempo real de forma assíncrona:
    ```ts
    if (audioCtx && audioCtx.state !== "closed") {
      audioCtx.close().catch((err) => console.warn(err));
    }
    ```
  - Limpar imediatamente todas as referências de intervalos de cronômetros (`setInterval`) responsáveis por reproduzir o som de toque recursivo de espera para impedir sobreposição de áudio residual.

### B. Escopo de Sincronia no Firestore Sincronizado
- **Problema**: Forçar que o encerramento do atendimento pelo médico reflita instantaneamente do lado do paciente e encerre as conexões simultaneamente com elegância gráfica.
- **Estratégia**:
  - O ouvinte em tempo real (`onSnapshot`) mapeia a alteração do `status` do agendamento para `completed`.
  - No componente `TelemedicineRoom.tsx`, esse status monitorado aciona o fluxo de saída e encadeia um temporizador suave de feedback visual (efeito de fade-out com Framer Motion) por 2.5 segundos antes de executar a limpeza de mídia e retornar o cliente para seu respectivo painel principal.

### C. Responsividade do Bento Grid em Telas Estreitas (< 360px)
- **Problema**: Em resoluções extremamente compactas de celulares (por exemplo, iPhone SE com largura menor que 360px), as visualizações de feeds de vídeo e botões de comando podem truncar ou escorregar para fora da área visual (overflow).
- **Estratégia**:
  - Utilizar classes utilitárias responsivas do Tailwind CSS (`max-sm:h-28`, `max-sm:aspect-video`, `md:aspect-square`).
  - Redefinir a barra de controles inferiores de mudo/vídeo para se acomodar em uma grade flexível ou grid de quatro colunas com menos espaço de padding interno (`px-2 py-1.5`) e áreas de toque mínimas de 44x44px.
  - Transformar o painel flutuante do chat em sobreposição absoluta (`absolute right-0 bottom-16 top-0 w-80 bg-slate-950 z-50 shadow-2xl rounded-l-2xl border-l border-slate-800`) para não comprimir o feed de vídeo quando aberto.

---

## 🚀 2. Plano de Ação Passo a Passo

### 📅 Fase 1: Desativação Física dos Dispositivos (Resolvendo Issue #1)
1. No `useEffect` que lida com o ciclo de vida do componente `TelemedicineRoom.tsx` ou no fechamento da consulta:
   - Capturar o stream local ativo e dar um loop interrompendo as faixas de vídeo e áudio físico.
   - Chamar `.close()` na referência do `AudioContext` instanciado para o analisador de frequência.
   - Desabilitar loops paralelos de ringtone no desmontar do componente (`componentWillUnmount` conceitual de retorno do `useEffect`).

### 📅 Fase 2: Redirecionamento e Sincronização Síncrona de Saída (Resolvendo Issue #2)
1. Integrar um validador no snapshot do Firestore. Se o status da consulta for detectado como `completed`:
   - Ativar uma tela de encerramento elegante e dinâmica ("Transmissão Encerrada / Consulta Concluída pelo Profissional") com animações fluidas do Framer Motion.
   - Disparar a limpeza de hardware local programada.
   - Adicionar um timer de 2.5 segundos para transicionar suavemente e acionar o callback `onLeave()`, que limpa a tela principal e redireciona o usuário para seu painel de controle (Agenda para Médicos, Histórico para Pacientes).

### 📅 Fase 3: Layout Mobile Fino e Notas WebRTC Avançadas (Resolvendo Issue #3)
1. Modificar as marcações CSS no componente `TelemedicineRoom.tsx`:
   - Reduzir margens e paddings visuais de cards sob query-screen mobile (`px-3 py-2 sm:px-6 sm:py-4`).
   - Ajustar as propriedades de largura e posicionamento do painel de chat de forma condensada.
2. Inserir notas e comentários robustos documentando como a orquestração atual de canal de dados sínclono governada via Firestore escala em produção utilizando WebRTC real (ex: handshake SDP, transações de ICE Candidates e conexões STUN/TURN).

---

## 🧪 3. Protocolo de Homologação e Testes de Qualidade

Para garantir a qualidade de cada correção sem corromper o sistema existente:
- **Teste de Vazamento de Hardware (Mídia)**:
  - Ingressar na chamada de telemedicina.
  - Conceder permissão de áudio e vídeo e observar o funcionamento e as barras dinâmicas do analisador local.
  - Encerrar o atendimento e certificar-se de que a webcam fisicamente suspenda seu funcionamento (LED apague) e não haja logs de erro de `AudioContext` pendentes no painel de console do navegador.
- **Teste de Sincronia de Saída**:
  - Abrir duas janelas concorrentes (médico e paciente) e simular a entrada do peer usando o botão auxiliar de simulação de homologação de participante.
  - Clicar em "Desconectar e Finalizar" na aba profissional e confirmar se a tela do paciente atualiza na hora com animações de encerramento, forçando ambos a retornar aos seus respectivos dashboards amigavelmente.
- **Teste Visual de Tamanho Compacto (Responsividade SE)**:
  - Reduzir a resolução do simulador de navegação no DevTools do navegador para 320px de largura.
  - Testar todas as interações (mudo, câmera, digitar no chat, alternar abas de observação) para atestar conforto tátil e visual impecáveis.
