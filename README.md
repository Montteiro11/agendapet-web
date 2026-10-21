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
