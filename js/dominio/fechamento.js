// =========================================================
// dominio/fechamento.js – cálculos do fechamento do dia (US07).
//
// Sem DOM: a mesma função é usada na página e, na US11,
// no script de terminal "npm run fechamento".
// =========================================================

import { STATUS } from './agendamento.js';
import { filtrarAgendamentos, dataParaISO, horaParaTexto } from './regras.js';

/**
 * Calcula o fechamento de um dia.
 *
 * @param {Agendamento[]} lista – todos os agendamentos
 * @param {string} dia          – "AAAA-MM-DD"
 * @param {Date} agora          – data/hora atual (para achar o próximo atendimento)
 */
export function calcularFechamento(lista, dia, agora = new Date()) {
  // 1. Só os agendamentos do dia escolhido (callback como critério)
  const doDia = filtrarAgendamentos(lista, (agendamento) => agendamento.data === dia);

  // 2. filter: separa por status
  const concluidos = doDia.filter((agendamento) => agendamento.status === STATUS.CONCLUIDO);
  const agendados = doDia.filter((agendamento) => agendamento.status === STATUS.AGENDADO);
  const cancelados = doDia.filter((agendamento) => agendamento.status === STATUS.CANCELADO);

  // 3. reduce: soma os valores. Faturamento = SÓ os concluídos.
  //    "soma" começa em 0 e, a cada item, recebe soma + valor do item.
  const faturamento = concluidos.reduce((soma, agendamento) => soma + agendamento.calcularValor(), 0);
  const previsto = agendados.reduce((soma, agendamento) => soma + agendamento.calcularValor(), 0);

  // 4. Laço for: conta quantos atendimentos de cada serviço (sem os cancelados).
  //    O resultado é um objeto: { "Banho": 2, "Tosa": 1 }
  const ativos = doDia.filter((agendamento) => agendamento.estaAtivo());
  const porServico = {};
  for (let i = 0; i < ativos.length; i++) {
    const nome = ativos[i].nomeServico;
    porServico[nome] = (porServico[nome] ?? 0) + 1;
  }

  // 5. Próximo atendimento: o Agendado de horário mais cedo.
  //    Se o dia for hoje, só conta quem ainda não passou da hora.
  const hoje = dataParaISO(agora);
  const horaAtual = horaParaTexto(agora);
  const candidatos = dia === hoje
    ? agendados.filter((agendamento) => agendamento.horario > horaAtual)
    : agendados;

  // sort: ordena por horário ("08:30" vem antes de "10:00").
  // [...candidatos] faz uma cópia, para não mudar a ordem da lista original.
  const ordenados = [...candidatos].sort((a, b) => a.horario.localeCompare(b.horario));
  const proximo = dia < hoje ? null : ordenados[0] ?? null;

  // 6. every: o dia está encerrado se TODOS já foram concluídos ou cancelados
  const diaEncerrado = doDia.length > 0 && doDia.every((agendamento) => agendamento.status !== STATUS.AGENDADO);

  return {
    dia,
    totalAtendimentos: ativos.length,
    concluidos: concluidos.length,
    agendados: agendados.length,
    cancelados: cancelados.length,
    faturamento,
    previsto,
    porServico,
    proximo,
    diaEncerrado,
  };
}
