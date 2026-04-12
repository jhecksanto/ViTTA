# Issue 6: Substituição de Mock Data

## Descrição
O arquivo `src/constants.ts` ainda contém dados mockados que precisam ser substituídos por buscas reais no banco de dados Firestore.

## Page / Component
- Vários componentes que consomem esses dados (ex: Dashboard, AppointmentsView, OffersView, etc.)
- Arquivo: `src/constants.ts`

## Comportamentos Esperados (Behaviors)
1. **Remoção**: Remover os dados estáticos (`MOCK_CATEGORIES`, `MOCK_PARTNERS`, `MOCK_EXAMS`, `MOCK_APPOINTMENTS`, `MOCK_STATS`, `MOCK_OFFERS`, `MOCK_PROFESSIONALS`) do arquivo `constants.ts`.
2. **Integração Firestore**: Implementar hooks ou chamadas diretas ao Firestore (`getDocs`, `onSnapshot`) para buscar esses dados reais nas respectivas coleções.
3. **Atualização de Componentes**: Integrar a busca real aos componentes que dependem dessas informações, garantindo que lidem corretamente com estados de carregamento (loading) e dados vazios.
