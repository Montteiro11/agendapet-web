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

### Endereço por CEP (US04)
- O checkbox **Atendimento a domicílio** só fica liberado para serviços com `"domiciliar": true` no `servicos.json` (a hospedagem não atende a domicílio).
- Ao completar 8 números no CEP (com ou sem hífen), a página consulta `https://viacep.com.br/ws/{cep}/json/` e preenche rua, bairro, cidade e UF. Número e complemento são digitados.
- Cada falha tem uma mensagem própria: **CEP inválido** (menos de 8 números), **CEP não encontrado** (o ViaCEP responde `"erro": true`) e **sem conexão** (o `fetch` falha).
- Os campos de endereço nunca ficam bloqueados: se o ViaCEP estiver fora do ar, a atendente digita o endereço à mão.
- O endereço é obrigatório apenas quando o atendimento é a domicílio.

### Alerta de feriados (US05)
- Ao escolher a data, a página consulta `https://brasilapi.com.br/api/feriados/v1/{ano}`.
- A lista do ano fica guardada no `localStorage` na chave `agendapet:feriados:{ano}`, junto com a data da consulta. **Validade do cache: 30 dias.** Enquanto o cache vale, não há nova requisição, nem depois de recarregar a página.
- Se a data for feriado, aparece o nome do feriado e o agendamento só é salvo depois de marcar **"Agendar mesmo assim"**.
- Se a BrasilAPI falhar, aparece o aviso "Não foi possível verificar feriados agora" e o agendamento pode continuar normalmente.
- Todo acesso ao `localStorage` passa por `js/storage.js`, com `try/catch`: um valor corrompido não quebra a página.

 ### Regras de negócio e fechamento do dia (US07)
- **Classes** (`js/dominio/agendamento.js`): `Agendamento` guarda os dados e tem os métodos `calcularValor()`, `resumo()`, `concluir()`, `cancelar()` e `estaAtivo()`. A subclasse `AgendamentoDomiciliar extends Agendamento` acrescenta o `endereco` e sobrescreve `calcularValor()`, `resumo()` e `toJSON()`.
- **Taxa de deslocamento:** valor fixo de **R$ 20,00** somado ao preço do serviço nos atendimentos a domicílio.
- **Conflito:** não é possível salvar dois agendamentos **ativos** (Agendado ou Concluído) no mesmo dia e horário. Um agendamento cancelado libera o horário.
- **Protocolo:** sequencial no formato `AP-0001`, gerado por uma **closure** (`criarGeradorDeProtocolo`), que guarda o contador sem variável global. Um protocolo só é gerado quando o agendamento é salvo de fato.
- **Callback:** `filtrarAgendamentos(lista, criterio)` recebe a função que decide quem entra no resultado.
- **Fechamento do dia** (`js/dominio/fechamento.js`):
  - *Atendimentos*: agendamentos do dia que não foram cancelados.
  - *Faturamento*: soma do valor apenas dos **concluídos**.
  - *Previsto*: soma do valor dos que ainda estão como Agendado.
  - *Cancelados* e *quantidade por serviço*.
  - *Próximo atendimento*: o Agendado de horário mais cedo (se o dia for hoje, só os que ainda não passaram).
  - Usa os métodos de array `filter`, `reduce`, `sort`, `find`, `some`, `every` e `map`, e os laços `for` e `for...of`.

### const, let e var
| Palavra | Pode receber outro valor? | Escopo | Uso no projeto |
|---|---|---|---|
| `const` | Não | Bloco `{ }` | Padrão para tudo que não muda: funções, elementos do DOM, o array `agendamentos` (o conteúdo muda com `push`, mas a variável aponta sempre para o mesmo array). |
| `let` | Sim | Bloco `{ }` | Valores que mudam: `servicos`, o `contador` do protocolo, `feriadoDaData`, o `i` do laço `for`. |
| `var` | Sim | Função inteira (ignora o bloco) | **Não usamos.** O `var` "vaza" para fora de `if` e `for`, pode ser usado antes de ser declarado (hoisting, vale `undefined`) e pode ser declarado duas vezes sem erro. Isso causa bugs difíceis de achar; `const` e `let` evitam esses problemas. |

### Testes automáticos (bônus)
- `npm test` roda `tests/dominio.test.js` com o executor de testes que já vem no Node (`node:test`), sem instalar nada.
- São 10 testes cobrindo os cenários de aceite da US07: taxa do domiciliar, conflito de horário, protocolos sequenciais, faturamento só dos concluídos, contagem por serviço e cancelados.
