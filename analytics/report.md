# Relatório de Análise Geral do Sistema de Telemedicina
**Data e Hora de Geração:** 15 de junho de 2026, 20:03:29 (Horário de Brasília)

---

## 📋 Introdução e Escopo
Este documento apresenta uma análise detalhada sobre o estado atual da implementação da telemedicina no sistema **Vitta** e identifica as lacunas e requisitos faltantes para completar a solução. 

Atualmente, o sistema possui uma tela de consulta por vídeo funcional (`TelemedicineRoom`) que gerencia estados em tempo real como transmissão local, mudo, câmera desligada, compartilhamento de tela e chat síncrono integrado com o Firestore. No entanto, o sistema carece de um ciclo de vida robusto para links únicos e controle refinado de acesso.

---

## 🔍 Análise do Estado Atual (Diagnóstico)

### 1. Mecanismo de Entrada na Chamada
* **Atualmente:** A sala de telemedicina é ativada através do estado local do componente pai (`activeTelemedicineApt`), que substitui a visualização principal do dashboard.
* **Limitação:** Não há deep-linking ou URLs dedicadas para as salas de consulta. Ao clicar em "Convidar" na sala, o sistema copia apenas a URL base atual do navegador (`window.location.href`). Se outro usuário abrir essa URL, ele será enviado para o dashboard principal e não entrará diretamente na chamada correspondente.

### 2. Geração e Unicidade dos Links
* **Atualmente:** Não há armazenamento de links ou IDs de sala únicos no Firestore para cada agendamento de telemedicina.
* **Limitação:** Falta um identificador exclusivo (como um token/UUID) por consulta que atue como o endereço de conexão seguro e único para aquele atendimento.

### 3. Validação e Ciclo de Vida do Link
* **Atualmente:** O profissional de saúde pode finalizar a consulta clicando em "Desconectar e Finalizar", o que atualiza o `status` do agendamento para `completed` e fecha a sala localmente para si e para o paciente.
* **Limitação:** Como o link não é um recurso explícito, não há regras de expiração ou validação de encerramento do link. Se o usuário tentar acessar a sala de consulta após a finalização, não há uma barreira que informe explicitamente que a sessão de telemedicina expirou ou foi concluída.

---

## 🚀 Requisitos Restantes para Conclusão da Telemedicina

Para que a implementação atinja o padrão esperado pelo usuário de "link único por chamada" e "acessível somente até a finalização pelo profissional", os seguintes aspectos devem ser construídos:

### 📑 Requisito 1: Geração de Link Único Baseado em UUID/Token
* Cada agendamento onde a modalidade for `telemedicine` ou `online` deve receber um identificador de sala exclusivo e seguro (`telemedicineRoomId`) gerado no momento do agendamento ou na abertura da chamada pelo médico.
* A URL gerada deve ter o formato consistente como de deep-linking (`https://.../?room={telemedicineRoomId}` ou usando o roteador interno com hash).

### 📑 Requisito 2: Ciclo de Vida do Link e Acesso Condicional
* **Ativação:** O link se torna ativo apenas quando a consulta é iniciada (ou em um intervalo pré-determinado antes do horário agendado).
* **Validação de Acesso:** Ao entrar na sala de telemedicina, o sistema deve validar se o `status` da consulta no Firestore é diferente de `completed` ou `cancelled`.
* **Expiração imediata:** Assim que o médico profissional acionar a desconexão ("Desconectar e Finalizar"), o `status` da consulta é alterado para `completed`. Tentativas de acesso subsequentes com o link desta sala devem ser imediatamente bloqueadas pela interface, redirecionando o usuário para uma tela de aviso: *"Esta consulta/link de transmissão foi encerrado pelo profissional."*

### 📑 Requisito 3: Roteamento Inteligente e Integração de Deep-linking
* O sistema deve reconhecer o parâmetro de sala na URL de inicialização do app (exemplo: query string `?room=XYZ` ou roteador interno) e, se o usuário estiver autenticado e for parte da consulta, redirecioná-lo automaticamente para o `TelemedicineRoom` correspondente.

### 📑 Requisito 4: Interface do Paciente e do Médico Atualizados
* O card de consulta de ambos deve mostrar claramente a opção de copiar o link único de telemedicina para compartilhamento externo facilitado (ex: convidar acompanhante ou médico assistente), exibindo o status do link ("Ativo" ou "Expirado").

---
