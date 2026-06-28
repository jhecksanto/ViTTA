# Issue 4: Responsividade e Layout Compacto em Telas < 360px
**Data e Hora de Geração:** 27 de junho de 2026, 21:49:18 (Horário de Brasília)

---

## 📌 Contexto
Dispositivos compactos (como celulares de tela estreita) sofrem com estouro horizontal na barra de controle flutuante inferior do chat, botões de câmera, microfone, e botões de desligamento da videoconferência devido a paddings e lacunas horizontais (`gap`) elevados.

## 🎯 Requisitos
1. **Paddings e Gaps Adaptativos**: Ajustar as classes Tailwind da barra de ferramentas flutuante inferior para reduzir gaps e paddings horizontais em viewports extremamente estreitos:
   - Substituir `gap-4 px-6` por algo como `gap-2 max-xs:gap-1.5 px-3 max-xs:px-1.5`.
2. **Dimensionamento de Botões de Controle**: Assegurar que botões não estolem a largura, mantendo a área de clique recomendada de pelo menos 44px para telas sensíveis ao toque.
3. **Painel Clínico e Chat Drawer**: No menu lateral profissional do chat, garantir que cabeçalhos e textos de abas de prontuário, receitas e atestados diminuam de fonte para caber em colunas apertadas sem empilhar de forma estragada.

## 🔧 Componente Alvo
- `/src/components/TelemedicineRoom.tsx`
