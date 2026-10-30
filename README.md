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
- São 12 testes cobrindo os cenários de aceite da US07 e da US06: taxa do domiciliar, conflito de horário, protocolos sequenciais, faturamento só dos concluidos, contagem por serviço e cancelados, ordem da agenda, busca e filtro.

### Agenda do dia (US06)
- A lista é montada por JavaScript (`createElement`, `textContent` e `classList`), **ordenada por data e horário**, com o status Agendado, Concluído ou Cancelado.
- **Mouse:** botões **Concluir** e **Cancelar** (só para quem está Agendado), destaque ao passar o mouse (`mouseover`/`mouseout`) e seleção do item com clique, que mostra telefone, espécie e observações.
- **Teclado:** todos os itens e botões são alcançáveis com **Tab**; **Enter** ou **Espaço** selecionam o item.
- **Busca em tempo real** por tutor ou pet (evento `input`), sem diferenciar maiúsculas de minúsculas nem acentos.
- **Filtro por status** e contador "X agendamentos", com mensagem própria para lista vazia e para busca sem resultado.
- **Atalhos:** `N` vai ao formulário, `/` foca a busca e `Esc` limpa a busca. Os atalhos `N` e `/` não funcionam enquanto se digita em um campo, para não atrapalhar.
- **Exportar agenda:** mostra o JSON formatado para copiar, no mesmo formato que será lido pelos scripts de Node (US11). Bônus: botão para baixar como arquivo `.json`.
- A busca, o filtro e a ordenação ficam em `js/dominio/regras.js` (`filtrarAgenda`), sem DOM, e têm testes em `npm test`.

### Persistência e exportação dos dados (US08)
- A agenda, o **filtro de status** e o **tema** (claro ou escuro) ficam salvos no `localStorage` e voltam depois de recarregar a página (F5).
- Todo acesso passa por `js/storage.js`, com `JSON.stringify` e `JSON.parse` dentro de `try/catch`. Se um valor salvo estiver corrompido, a página abre normalmente (vazia) e um aviso aparece no console. Itens inválidos dentro da agenda são ignorados.
- **Chaves usadas** (todas com o prefixo `agendapet:`): `agendapet:agenda`, `agendapet:filtro`, `agendapet:tema` e `agendapet:feriados:{ano}`.
- Ao carregar, cada item salvo volta a ser um `Agendamento` ou `AgendamentoDomiciliar` (com os métodos), e o protocolo continua do último número usado.
- **Limpar meus dados:** apaga **somente** as chaves que começam com `agendapet:`; dados de outros sites ficam intactos. Para evitar acidentes, pede um segundo clique de confirmação (sem usar `confirm()`).
- **Tema escuro:** todas as cores do CSS são variáveis. O JavaScript coloca `data-tema="escuro"` na tag `<html>` e a regra `:root[data-tema="escuro"]` troca só os valores das variáveis.
- **Exportar agenda:** continua mostrando o JSON formatado, no mesmo formato salvo no `localStorage`.

### Relógio e lembretes de atendimento (US09)
- **setInterval** a cada **30 segundos** atualiza o relógio do cabeçalho, o texto "Próximo atendimento: … (em X min)", os atrasados e o "Próximo atendimento" do fechamento.
- **Atrasado:** atendimento de hoje cujo horário já passou e que continua como Agendado. Ganha a etiqueta vermelha "Atrasado há X min" e a borda vermelha.
- **Lembrete visual:** faltando **15 minutos ou menos**, o atendimento ganha a etiqueta "Em X min" e a borda laranja, e aparece um aviso (uma única vez por atendimento).
- **setTimeout:** os avisos temporários (toast) de lembrete, concluir, cancelar, pausar e limpar dados somem sozinhos depois de alguns segundos. Se chegar um aviso novo, o timer anterior é cancelado com `clearTimeout`, então os timers nunca se acumulam.
- **Pausar/Retomar lembretes:** o botão chama `clearInterval` e guarda `null` no lugar do id do timer. Ao retomar, um novo `setInterval` só é criado se não houver outro rodando (sem timers duplicados).
- O cálculo fica em `js/dominio/lembretes.js` (sem DOM e sem timers), com testes em `npm test`.


### Projeto Node.js e relatório de fechamento (US11)

**Scripts do `package.json`**

| Comando | O que faz |
|---|---|
| `npm start` | Sobe o servidor local (`http-server`) e abre a página. |
| `npm test` | Roda os testes automáticos do domínio (`node:test`). |
| `npm run fechamento` | Imprime no terminal o fechamento do dia lendo `data/agenda-exemplo.json`. Aceita um dia e um arquivo: `npm run fechamento -- 2026-10-30 data/agenda-exemplo.json`. |
| `npm run validar` | Valida `data/agenda-exemplo.json` (campos obrigatórios, data e hora válidas, status, endereço do domiciliar, protocolo repetido e conflito de horário). Aceita outro arquivo: `npm run validar -- data/agenda-invalida.json`. Termina com `process.exit(1)` se houver erro. |

- `data/agenda-exemplo.json` tem 10 agendamentos no mesmo formato do botão **Exportar agenda** da página, então um arquivo exportado também pode ser validado e fechado pelos scripts.
- `data/agenda-invalida.json` tem erros de propósito, para demonstrar o validador.
- `scripts/fechamento-dia.js` importa os **mesmos módulos** de `js/dominio/` usados na página: a regra do fechamento é uma só, no navegador e no terminal.

**Instalação local x global**

| | Local (`--save-dev`) | Global (`-g`) |
|---|---|---|
| Onde fica | Na pasta `node_modules/` do projeto | Numa pasta do computador, fora do projeto |
| Quem usa | Só este projeto | Qualquer pasta, pelo terminal |
| Vai para o `package.json`? | Sim, em `devDependencies` | Não |
| Quem clona o projeto | Instala tudo com `npm install` | Precisa instalar por conta própria |
| Quando usar | Ferramentas de que o projeto depende (servidor, testes, linter) | Ferramentas de uso geral do computador |

- **O que instalei e onde:** o `http-server` foi instalado **localmente** como dependência de desenvolvimento (`npm install --save-dev http-server`) e é usado pelo `npm start`. Não instalei nada globalmente para este projeto: assim, quem clonar o repositório só precisa do Node.js e de um `npm install`.
- **Comandos:**
  - `npm install --save-dev http-server`: instala localmente, como dependência de desenvolvimento.
  - `npm install -g <pacote>`: instala globalmente (não usado neste projeto).
  - `npm ls`: lista os pacotes instalados no projeto.
  - `npm ls -g --depth=0`: lista os pacotes globais, só o primeiro nível.
  - `npx http-server`: executa um pacote sem instalar globalmente (usa o local, se existir).

**CommonJS x ESM**

| | CommonJS | ESM (ES Modules) |
|---|---|---|
| Importar | `const fs = require('fs')` | `import { readFile } from 'node:fs/promises'` |
| Exportar | `module.exports = { ... }` | `export function ...` |
| Extensão | `.cjs` (ou `.js` sem `"type": "module"`) | `.mjs` (ou `.js` com `"type": "module"`) |
| `"type"` no `package.json` | padrão do Node quando não há `"type"` | `"type": "module"` |
| Carregamento | Síncrono, na hora em que o `require` roda | Analisado antes de executar; permite `await` no topo do arquivo |
| No navegador | Não funciona sem ferramenta extra | Funciona com `<script type="module">` |

- **Escolha:** o projeto usa **ESM** (`"type": "module"`) porque o mesmo código de `js/dominio/` precisa rodar no navegador e no Node, e o navegador só entende `import`/`export`. O `scripts/validar-agenda.cjs` é **CommonJS** de propósito, com `require` de `fs` e `path`, para mostrar o outro formato: a extensão `.cjs` faz o Node tratá-lo como CommonJS mesmo com `"type": "module"`.

### Depuração e relatório de bug (US12)
- `.vscode/launch.json` tem três configurações: **Depurar fechamento do dia (Node)**, **Depurar testes do domínio (Node)** e, opcional, **Depurar página no Chrome**.
- Para praticar, foi introduzido um **erro controlado** no fechamento (o faturamento somava os cancelados). Ele foi encontrado com **breakpoint**, **breakpoint condicional**, inspeção de variáveis, **Watch** e **Call Stack**, e corrigido em um commit `fix`.
- Relatório completo em [docs/bug-report.md](docs/bug-report.md), com a evidência em `docs/depuracao.png`.

## Autoria
- Desenvolvido por **Vanessa Monteiro Paim**.

