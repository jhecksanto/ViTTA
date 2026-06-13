# Issue 01: Integração Funcional e Controle de Fluxo da Sala de Telemedicina (`TelemedicineRoom`)
**ID:** `issue-01-integracao-telemedicina`  
**Prioridade:** Alta  
**Status:** Pronto para Planejamento  

---

## 1. Descrição do Problema
O componente `src/components/TelemedicineRoom.tsx` foi criado com sucesso, contendo todas as regras de gerenciamento WebRTC simulado, chat, prescrições e sincronização de dados de consulta através do Firestore. No entanto, o componente está órfão: não há nenhuma forma do médico ou do paciente entrarem nessa sala de teleconsulta.

---

## 2. Abordagem / Planejamento Técnico Detalhado
Para amarrar o componente `TelemedicineRoom` com o restante do aplicativo de forma nativa e livre de conflitos, seguiremos a seguinte receita:

### A. Criação de Estado de Controle na Raiz (`App.tsx`)
1. Adicionar o seguinte estado no componente principal do `App` (dentro de `App.tsx`):
   ```typescript
   const [activeTelemedicineApt, setActiveTelemedicineApt] = useState<any | null>(null);
   ```
2. No corpo da função de renderização do `App.tsx`, interceptar se há uma teleconsulta ativa:
   ```typescript
   if (activeTelemedicineApt) {
     return (
       <TelemedicineRoom 
         user={user}
         userData={userData}
         appointment={activeTelemedicineApt}
         onLeave={() => setActiveTelemedicineApt(null)}
       />
     );
   }
   ```
   *Nota:* O componente `TelemedicineRoom` precisa ser devidamente importado no cabeçalho do `App.tsx`:
   ```typescript
   import TelemedicineRoom from './components/TelemedicineRoom';
   ```

### B. Integração Visual no Fluxos do Paciente (`AppointmentsView`)
1. Pesquisar em `src/App.tsx` onde a listagem de agendamentos do paciente (`AppointmentsView` ou cards correspondentes) é desenhada.
2. Identificar consultas cujo tipo/modalidade seja elegível para Atendimento Remoto/Vídeo e que tenham data de hoje.
3. Exibir de forma proeminente o botão:
   ```tsx
   <button
     onClick={() => setActiveTelemedicineApt(apt)}
     className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/95 transition-all flex items-center gap-1.5 shadow-md shadow-vitta-accent/10"
   >
     <Video size={14} />
     Acessar Teleconsulta
   </button>
   ```

### C. Integração Visual no Fluxos do Médico (`ProfessionalDashboardView`)
1. Na visualização de gerenciamento da agenda diária do médico (`ProfessionalDashboardView` -> `subTab === 'agenda'`), achar a renderização de cada paciente.
2. Adicionar o botão "Teleconsulta por Vídeo" do lado do prontuário ou do botão "Iniciar/Avançar".
3. Quando o médico clica nesse botão:
   - Dispara `setActiveTelemedicineApt(apt)`.
   - Pode disparar uma atualização no status do agendamento para `'in_progress'`.

---

## 3. Critérios de Aceitação
- [ ] O paciente consegue disparar a abertura do componente `TelemedicineRoom` ao clicar no botão de teleconsulta de hoje.
- [ ] O médico consegue disparar a abertura do componente `TelemedicineRoom` a partir de sua planilha de atendimentos.
- [ ] Ao encerrar a chamada ou sair da tela através do botão de encerramento da sala de vídeo, o estado é totalmente reestabelecido e o usuário retorna exatamente para a aba em que estava no painel principal.
- [ ] O áudio e vídeo de preview da câmera local param de transmitir (liberação de recursos da câmera de forma limpa pelo cleanup do track de mídia).
