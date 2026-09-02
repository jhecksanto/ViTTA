# Issue 03: Roteamento e Acesso Direto via Link de Convite (`/?room={id}`)
**Data e Hora de Atualização:** 02/09/2026 às 20:34 (Horário de Brasília - UTC-3)  
**Status:** Concluída  
**Escopo:** Aplicação Raiz / Roteamento e Navegação

---

## 1. Contexto e Problema
Tanto na sala de telemedicina (`TelemedicineRoom.tsx`) quanto na agenda profissional (`ProfessionalDashboardView.tsx`), existem botões para copiar o link direto da teleconsulta (`${window.location.origin}/?room=${apt.id}`).
No entanto, o componente raiz `App.tsx` não inspecionava os parâmetros da URL (`window.location.search`).

---

## 2. Escopo de Alteração Realizado
* **Arquivo Alvo:** `src/App.tsx`
* Implementado `useEffect` em `App.tsx` que detecta o parâmetro `?room={roomId}` ao autenticar o usuário, recupera a consulta no Firestore (`getDoc`) e ativa a sala virtual via `setActiveTelemedicineApt`.
* Adicionada limpeza automática do parâmetro `?room=` via `window.history.replaceState` no callback `onLeave` do componente `TelemedicineRoom`.

---

## 3. Critérios de Aceite
- [x] Acessar `http://localhost:3000/?room=<ID_DA_CONSULTA>` com login ativo carrega automaticamente os dados da consulta e abre o modal `TelemedicineRoom`.
- [x] Ao clicar em "Sair da Sala" ou concluir o atendimento, o parâmetro `?room=` é removido da barra de endereços sem recarregar a página.
