# Issue 02: Implementar Registro de Agendamento no Firestore

**Descrição:**
O `BookingModal` atualmente apenas redireciona para o WhatsApp. É necessário que ele também registre o agendamento no banco de dados para que o usuário possa visualizá-lo na aba "Meus Agendamentos".

**Tarefas:**
1.  Modificar a função `handleConfirm` no componente `BookingModal`.
2.  Adicionar lógica para salvar um novo documento na coleção `appointments` usando `addDoc`.
3.  Campos obrigatórios: `userId`, `professionalId`, `professionalName`, `specialty`, `imageUrl`, `date`, `time`, `status: 'upcoming'`, `createdAt`.
4.  Garantir que o redirecionamento para o WhatsApp continue funcionando após (ou simultaneamente) ao salvamento no banco.
5.  Adicionar feedback visual (toast ou loading state) durante o processo de salvamento.

**Critérios de Aceite:**
*   Ao confirmar um agendamento, um novo documento deve aparecer na coleção `appointments` no Firestore.
*   O agendamento deve aparecer imediatamente na aba "Meus Agendamentos" do usuário.
