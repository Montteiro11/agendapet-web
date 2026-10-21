# AgendaPet Web

Painel de agendamentos para o pet shop **Patinhas & Cia** (banho, tosa, consulta, vacina, hospedagem e adestramento).

> Projeto Avaliativo M1.2 – Front-End React T4. README em construção ao longo da sprint.

## Como executar

Requisito: Node.js 18 ou superior.

```bash
git clone <link-do-repositorio>
cd agendapet-web
npm install
npm start
```

O `npm start` abre a página em `http://localhost:8080`.
Não abra o `index.html` com duplo clique: o projeto usa `fetch` e módulos ES, que só funcionam por um servidor.

## Planejamento
- [Sprint Planning](planejamento/sprint-planning.md)
Kanban: https://trello.com/invite/b/6ad7b4650e20d991aeb3ed0c/ATTI16f8530ccd3f0036203f91362183ec72D45B3CB3/agendapet-web-sprint

## Regras e decisões

### Formulário de agendamento (US03)
- **Horário de funcionamento:** 08:00 às 18:00. O último atendimento começa às 17:30.
- **Data:** não pode estar no passado. Se a data for hoje, o horário também não pode ter passado.
- **Telefone:** DDD + número, com 10 dígitos (fixo) ou 11 (celular). Parênteses, espaços e hífen são aceitos.
- **Espécies:** Cão, Gato ou Outro.
- **Validação:** feita em JavaScript no evento `submit` (com `preventDefault`), em `js/dominio/regras.js`. As mensagens aparecem na tela (sem `alert`), o resumo é anunciado com `role="alert"` e o foco vai para o primeiro campo inválido.

