# Issue 09: Central de Exames, Visualizador de Laudos em PDF e Compartilhamento Médico
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Módulo Paciente & Benefícios  
**Páginas:** `exams` (`ExamsView`)

---

## 1. Escopo & Objetivos
Finalizar o visualizador embutido de laudos e exames (PDF e imagens), categorização por status de processamento e opção de vincular o exame diretamente ao prontuário médico.

## 2. Tarefas Detalhadas
- [ ] **Visualizador Embutido de Exames:** Modal responsivo com renderizador de PDF e visualizador de imagens com zoom, rotação e download do documento original.
- [ ] **Filtros por Status e Tipo:** Filtros de visualização por `Todos`, `Laudo Pronto`, `Aguardando Coleta`, `Em Análise` e por tipo de exame (Laboratorial vs Imagem).
- [ ] **Compartilhamento com Médico Solicitante:** Ação para disponibilizar o resultado do exame no prontuário eletrônico do médico responsável.

## 3. Critérios de Aceite
- O paciente consegue abrir e ler laudos em PDF diretamente pelo celular ou computador sem erros de renderização.
- Exames com status `Laudo Pronto` exibem badge verde em destaque.
- O médico visualiza os exames vinculados durante a consulta de retorno.
