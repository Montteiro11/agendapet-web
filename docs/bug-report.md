# Relatório de bug – Faturamento do dia somando atendimentos cancelados

**Ticket:** US12 – Depuração e relatório de bug
**Branch:** `fix/US12-faturamento-cancelados`
**Tipo:** erro controlado, introduzido de propósito para praticar a depuração (como permite o enunciado da US12).

## Descrição
O "Faturamento (concluídos)" do fechamento do dia mostrava um valor maior do que o real: os atendimentos **cancelados** também estavam sendo somados.

## Passos para reproduzir
1. Na branch `fix/US12-faturamento-cancelados`, no commit com o erro controlado, rodar `npm run fechamento`.
2. Ver o fechamento de 30/10/2026, lido de `data/agenda-exemplo.json`.
3. Rodar `npm test`.

## Resultado esperado
- Concluídos: **4**
- Faturamento (concluídos): **R$ 430,00** (Rex 60 + Mia 80 + Thor 120 + Luna 150 + 20 de taxa de domicílio)
- `npm test`: 14 testes passando.

## Resultado obtido
- Concluídos: **5**
- Faturamento (concluídos): **R$ 520,00**: os R$ 90,00 da vacina da Pipoca (AP-0005, **cancelada**) entraram na soma.
- `npm test`: 1 teste falhando ("fechamento: faturamento soma só os concluídos…").

## Como foi encontrado (depuração no VS Code)
1. Configuração **"Depurar fechamento do dia (Node)"** em `.vscode/launch.json`.
2. **Breakpoint condicional** na linha 30 de `js/dominio/fechamento.js` (dentro do `reduce`), com a condição `agendamento.status === 'Cancelado'`. Se o depurador parar ali, é porque um cancelado está sendo somado.
3. O depurador **parou** no AP-0005 (Pipoca, Cancelado). No painel **Variables** apareceram `soma` e `agendamento`.
4. No painel **Watch**, as expressões `concluidos.length` (5) e `concluidos.map(a => a.status)` mostraram um item "Cancelado" dentro da lista de concluídos.
5. A **Call Stack** mostrou o caminho: `scripts/fechamento-dia.js` → `calcularFechamento` → callback do `reduce`. O problema estava antes do `reduce`, na lista que ele recebe.
6. **Breakpoint** na linha 23 (onde `concluidos` é criado) e F5 de novo: a condição do `filter` era `status !== 'Agendado'`.

Evidência: `docs/depuracao.png` (VS Code pausado no breakpoint, com Variables, Watch e Call Stack).

## Causa raiz
O `filter` de `concluidos` usava "**tudo que não está Agendado**" (`!== STATUS.AGENDADO`). Isso inclui **Concluído e também Cancelado**. A regra certa é "**somente Concluído**".

```js
// Antes (errado)
const concluidos = doDia.filter((agendamento) => agendamento.status !== STATUS.AGENDADO);

// Depois (correto)
const concluidos = doDia.filter((agendamento) => agendamento.status === STATUS.CONCLUIDO);
```

## Correção
- Commit: [fix(US12): faturamento soma apenas atendimentos concluídos](https://github.com/Montteiro11/agendapet-web/pull/28/changes/33c9dcf577202bb8532e83059f5af0db61941a8b)
- Pull Request: https://github.com/Montteiro11/agendapet-web/pull/28
- Depois da correção: `npm run fechamento` mostra **R$ 430,00** e `npm test` volta a ter **14 testes passando**.

## Como evitar
O teste automático "fechamento: faturamento soma só os concluídos…" pegou o erro antes da página. Mudanças em `js/dominio/` devem sempre ser seguidas de `npm test`.
