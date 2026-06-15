# Issue #2: Geração e Compartilhamento do Link Único de Telemedicina
**Data e Hora de Geração:** 15 de junho de 2026, 20:03:29 (Horário de Brasília)

---

## 📌 Descrição
Criar um mecanismo síncrono para gerar links e chaves exclusivas de sala no Firestore para consultas virtuais e exibi-los no painel de acompanhamento do paciente e do profissional de saúde.

## 🛠 Requisitos de Implementação
1. **Atribuição no Gravador do Agendamento:**
   * Na rotina de agendamento de consultas com modalidade `telemedicine`, prever o salvamento da propriedade `telemedicineRoomId` usando o próprio ID do documento Firestore gerado (ou UUID autocriado) e `telemedicineUrl` amigável.
   * Exemplo de payload a ser salvo na coleção `appointments`:
   ```json
   {
     "modality": "telemedicine",
     "telemedicineRoomId": "id-do-agendamento",
     "telemedicineUrl": "https://vitta.app/?room=id-do-agendamento"
   }
   ```

2. **Visualização nos Cards de Atendimento:**
   * Implementar tanto no painel do paciente (`PatientDashboardView` / lista de consultas) quanto no do médico profissional (`ProfessionalDashboardView` / lista de atendimentos) o botão/badge interactivo.
   * **Elemento Visual:** Um botão circular ou com formato pill com ícone de link (`Share2` ou `Copy`) ao lado da identificação de telemedicina.
   * **Ação:** Ao clicar, fazer a cópia instantânea da URL customizada (`telemedicineUrl`) para a área de transferência com feedback visual de sucesso via `Toast`.

## ✅ Critérios de Aceite
- Todas as novas requisições ou reservas confirmadas de telemedicina devem gravar a propriedade `telemedicineRoomId` e `telemedicineUrl`.
- A interface de listagem de consultas de ambos os lados (médico e paciente) deve mostrar o ícone/botão para compartilhar o link direto daquela transmissão específica.
- O link copiado deve bater exatamente com o caminho esperado de ativação do deep-linking do app.
---
