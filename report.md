# Relatório de Pendências - Sistema ViTTA Health

Este relatório detalha as funcionalidades e melhorias que ainda precisam ser implementadas ou finalizadas no sistema ViTTA Health, com base na análise atual do código-fonte.

## 1. Painel Administrativo (AdminView)

### Gestão de Usuários (`UsersView`)
- **Criação de Usuários:** O botão "Novo Usuário" está presente na interface, mas não possui funcionalidade. É necessário implementar o modal de criação e a lógica de persistência no Firestore.
- **Upload de Imagem:** Implementar o upload de foto de perfil para novos usuários e na edição (atualmente usa URLs estáticas ou placeholders).

### Configurações do Sistema (`UserConfigView`)
- **Persistência de Dados:** As alterações nos níveis de acesso e permissões são apenas locais (state). É necessário integrar com uma coleção `system_configs` ou similar no Firestore para persistência real.
- **Logs de Auditoria:** Implementar uma seção para visualizar logs de ações administrativas (quem alterou o quê e quando).

## 2. Dashboard do Paciente (`PatientDashboardView`)

### Métricas de Saúde
- **Cálculo de Variação (`change`):** Os valores de variação percentual nos cards de estatísticas (ex: +12%, -5%) estão estáticos. Devem ser calculados dinamicamente comparando os dados atuais com o período anterior.
- **Dados do Gráfico:** O gráfico de evolução de passos utiliza dados mockados quando o histórico do usuário está vazio. Seria ideal exibir um estado "vazio" mais amigável ou incentivar o primeiro registro.

## 3. Configurações e Perfil (`SettingsView`)

### Segurança
- **Autenticação de Dois Fatores (2FA):** A interface permite ativar/desativar, mas a lógica real de desafio de 2FA no login ainda não foi integrada ao fluxo de autenticação principal.

## 4. Sistema de Notificações

### Gatilhos (Triggers)
- **Revisão Sistemática:** Embora agendamentos e exames já possuam gatilhos, é necessário revisar outras ações do usuário que devem gerar notificações, como:
    - Cancelamento de consultas.
    - Resgate de ofertas.
    - Alterações críticas no perfil.
- **Notificações Push:** Avaliar a implementação de Firebase Cloud Messaging (FCM) para notificações fora do navegador.

## 5. Arquitetura e Qualidade de Código

### Tratamento de Erros
- **Error Boundary Global:** Implementar um componente de Error Boundary no topo da aplicação para capturar falhas inesperadas e exibir uma tela de erro amigável, evitando o "white screen of death".
- **Saneamento de Dados:** Revisar as entradas de dados em formulários para garantir que tipos complexos (como arrays aninhados) sejam serializados corretamente antes de enviar ao Firestore.

### Mock Data
- **Remoção de `constants.ts`:** Continuar o processo de substituição de dados estáticos remanescentes no arquivo de constantes por buscas em tempo real no banco de dados.

---
*Relatório gerado em: 07 de Abril de 2026*
