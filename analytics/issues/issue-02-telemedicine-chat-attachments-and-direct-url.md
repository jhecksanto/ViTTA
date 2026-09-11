# Issue 02: Telemedicina - Envio de Anexos no Chat e Entrada Direta por URL
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Telemedicina / Chat & Roteamento  
**Prioridade:** P1 (Alta)  
**Arquivos Alvo:** `src/components/TelemedicineRoom.tsx`, `src/App.tsx`

---

## 1. Descrição e Contexto
Durante a consulta médica por vídeo, tanto o médico quanto o paciente precisam trocar laudos, exames anteriores e imagens complementares pelo chat lateral. Além disso, o acesso à sala por link direto contendo parâmetro na URL (`/?room=ID`) deve inicializar a sala e limpar a barra de endereços para manter a URL amigável.

---

## 2. Requisitos Técnicos
1. **Envio de Arquivos no Chat:**
   - Adicionar input de arquivo oculto com botão de anexo (`Paperclip`) no formulário de mensagem da sala.
   - Fazer upload do arquivo selecionado para o Firebase Storage em `telemedicine_chats/{appointmentId}/{timestamp}_{file.name}`.
   - Gravar a mensagem no Firestore com os campos `{ text, fileUrl, fileName, fileType, senderId, senderName, timestamp }`.
   - Renderizar visualmente imagens em miniatura com zoom ao clicar, e PDFs com link direto para download.
2. **Entrada Direta por URL:**
   - No `App.tsx`, interceptar parâmetros de busca `room` na URL (`new URLSearchParams(window.location.search).get('room')`).
   - Carregar o agendamento correspondente e abrir diretamente o componente `TelemedicineRoom`.
   - Executar `window.history.replaceState({}, '', window.location.pathname)` para limpar o parâmetro sem recarregar a página.

---

## 3. Critérios de Aceite
- [ ] Envio de fotos e PDFs pelo chat da sala de telemedicina funcional com preview.
- [ ] Acesso via link direto `/?room=ID` carrega a sala correspondente e limpa a URL.
