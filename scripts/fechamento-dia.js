// =========================================================
// scripts/fechamento-dia.js – fechamento do dia no TERMINAL (US11).
//
// Módulo ESM: usa import/export, como a página.
// Funciona porque o package.json tem "type": "module".
//
// Ele importa os MESMOS arquivos de js/dominio/ que a página usa.
// Prova de que a pasta dominio/ não depende do navegador.
//
// Como rodar:
//   npm run fechamento                          -> dia do primeiro agendamento do arquivo
//   npm run fechamento -- 2026-10-30            -> escolhe o dia
//   npm run fechamento -- 2026-10-30 data/minha-agenda.json
// (o "--" separa os argumentos do npm dos argumentos do script)
// =========================================================

import { readFile } from 'node:fs/promises';
import { criarAgendamento } from '../js/dominio/agendamento.js';
import { calcularFechamento } from '../js/dominio/fechamento.js';
import { ordenarAgenda } from '../js/dominio/regras.js';

// process.argv = ['node', 'scripts/fechamento-dia.js', 'arg1', 'arg2']
// .slice(2) pega só os argumentos digitados pela pessoa
const [diaInformado, arquivoInformado = 'data/agenda-exemplo.json'] = process.argv.slice(2);

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** "2026-10-30" -> "30/10/2026" */
function formatarData(textoISO) {
  const [ano, mes, dia] = textoISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// 1. Lê o arquivo JSON.
//    "await" direto no topo do arquivo (top-level await) só existe em ESM.
let dados;
try {
  const texto = await readFile(arquivoInformado, 'utf-8');
  dados = JSON.parse(texto);
} catch (erro) {
  console.error(`Não foi possível ler "${arquivoInformado}": ${erro.message}`);
  process.exit(1); // código 1 = terminou com erro
}

if (!Array.isArray(dados) || dados.length === 0) {
  console.error(`O arquivo "${arquivoInformado}" precisa ter uma lista (array) de agendamentos.`);
  process.exit(1);
}

// 2. Transforma cada objeto em Agendamento/AgendamentoDomiciliar (com os métodos)
const agendamentos = dados.map(criarAgendamento);

// 3. Dia do fechamento: o informado ou o do primeiro agendamento (em ordem)
const dia = diaInformado ?? ordenarAgenda(agendamentos)[0].data;

// 4. Cálculo: a MESMA função usada na seção "Fechamento do dia" da página
const resumo = calcularFechamento(agendamentos, dia, new Date());

// 5. Impressão no terminal
const linha = '='.repeat(48);
console.log(linha);
console.log(`  AgendaPet Web · Fechamento do dia ${formatarData(dia)}`);
console.log(`  Arquivo: ${arquivoInformado}`);
console.log(linha);
console.log(`  Atendimentos (sem cancelados): ${resumo.totalAtendimentos}`);
console.log(`  Concluídos:                    ${resumo.concluidos}`);
console.log(`  Ainda agendados:               ${resumo.agendados}`);
console.log(`  Cancelados:                    ${resumo.cancelados}`);
console.log(`  Faturamento (concluídos):      ${moeda.format(resumo.faturamento)}`);
console.log(`  Previsto (agendados):          ${moeda.format(resumo.previsto)}`);
console.log(
  resumo.proximo
    ? `  Próximo atendimento:           ${resumo.proximo.horario} – ${resumo.proximo.pet} (${resumo.proximo.protocolo})`
    : `  Próximo atendimento:           nenhum`
);
console.log('');

if (Object.keys(resumo.porServico).length > 0) {
  console.log('  Quantidade por serviço:');
  // console.table desenha uma tabela a partir de um objeto
  console.table(resumo.porServico);
} else {
  console.log('  Nenhum atendimento neste dia.');
}
