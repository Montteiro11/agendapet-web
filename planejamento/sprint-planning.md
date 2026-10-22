# Sprint Planning – AgendaPet Web

**Sprint:** 16/10/2026 a 30/10/2026 (2 semanas)
**Entrega no AVA:** até 02/11/2026, 22h
**Responsável:** Vanessa M. Paim

## Meta da sprint
Entregar à Patinhas & Cia um painel web que cadastre, valide e acompanhe os agendamentos do dia, com fechamento do caixa no navegador e no terminal.

## Estimativas (Fibonacci: 1, 2, 3, 5, 8)

| Ticket | História | Prioridade | Pontos | Branch |
|---|---|---|---|---|
| US01 | Estrutura semântica e acessível | Alta | 2 | feat/US01-US10-estrutura-layout |
| US10 | Layout responsivo e identidade visual | Alta | 5 | feat/US01-US10-estrutura-layout |
| US02 | Catálogo de serviços | Alta | 3 | feat/US02-catalogo |
| US03 | Formulário de novo agendamento | Alta | 5 | feat/US03-formulario |
| US04 | Endereço automático por CEP | Média | 3 | feat/US04-cep |
| US05 | Alerta de feriados | Média | 3 | feat/US05-feriados |
| US06 | Agenda do dia: lista, busca, filtros e atalhos | Alta | 5 | feat/US06-agenda |
| US07 | Regras de negócio e fechamento do dia | Alta | 8 | feat/US07-regras-fechamento |
| US08 | Persistência e exportação | Alta | 3 | feat/US08-persistencia |
| US09 | Relógio e lembretes | Média | 3 | feat/US09-lembretes |
| US11 | Projeto Node.js e relatório de fechamento | Alta | 5 | feat/US11-scripts-node |
| US12 | Depuração e relatório de bug | Média | 3 | docs/US12-bug-report |
| **Total** | | | **48** | |

## Ordem de execução e por quê
1. **Setup** (chore/setup-projeto): sem package.json e servidor local, o fetch não funciona.
2. **US01 + US10**: a estrutura HTML e o CSS base são o "esqueleto" onde todo o resto se encaixa.
3. **US02**: o catálogo alimenta o campo "serviço" do formulário, então vem antes da US03.
4. **US03, US04, US05**: formulário primeiro, depois as duas consultas a APIs que dependem dele.
5. **US07 antes da US06**: as classes e regras (js/dominio/) são usadas pela lista da agenda.
6. **US08, US09**: persistência e timers trabalham em cima da agenda já pronta.
7. **US11, US12**: os scripts de terminal reutilizam js/dominio/; a depuração usa o projeto completo.

## Riscos
- **ViaCEP ou BrasilAPI fora do ar:** tratar o erro e permitir preenchimento manual / continuar sem a verificação.
- **Pouco tempo disponível** (trabalho em turnos): dividir em tarefas pequenas e comitar a cada parte pronta.
- **Conteúdos novos** (CommonJS, depurador do VS Code): reservar a quinta 29/10 só para isso.
- **Esquecer de mover o Kanban:** mover o cartão ao abrir a branch e ao fazer o merge.

## O que seria cortado se faltasse tempo
1. Bônus (GitHub Pages, testes, @media print).
2. Preferência de tema na US08 (manter só agenda e filtro).
3. Destaque ao passar o mouse e detalhes visuais da US06.

## Resultado (preencher no fim da sprint)
- Pontos planejados: 48
- Pontos entregues:
- O que ficou de fora e por quê:
