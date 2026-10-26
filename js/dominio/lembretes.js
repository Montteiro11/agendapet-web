// =========================================================
// dominio/lembretes.js – cálculo dos lembretes do dia (US09).
//
// Sem DOM e sem timers: recebe a lista e o "agora" e devolve
// o que deve ser lembrado. Quem chama a cada 30 segundos é o app.js
// (setInterval). Assim dá para testar com qualquer horário.
// =========================================================

import { STATUS } from './agendamento.js';
import { dataParaISO } from './regras.js';

/** A partir de quantos minutos antes o atendimento ganha o lembrete visual. */
export const MINUTOS_LEMBRETE = 15;

/**
 * Quantos minutos faltam de "agora" até a data e o horário do agendamento.
 * Número negativo = o horário já passou.
 */
export function minutosAte(dataISO, horario, agora) {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const [horas, minutos] = horario.split(':').map(Number);
  const alvo = new Date(ano, mes - 1, dia, horas, minutos); // mês começa em 0 no Date
  // Diferença entre datas vem em milissegundos: / 60000 = minutos.
  // Math.ceil arredonda para cima: às 09:50:20, faltam "5 min" para as 09:55 (e não 4).
  // O "+ 0" transforma -0 em 0 (resultado de Math.ceil(-0.5)).
  return Math.ceil((alvo - agora) / 60000) + 0;
}

/**
 * Analisa os agendamentos de HOJE que ainda estão como "Agendado".
 *
 * @returns {{
 *   proximo: Agendamento|null,   – o próximo que ainda não passou
 *   minutosProximo: number|null, – quantos minutos faltam para ele
 *   alertas: object,             – { "AP-0003": { tipo: 'atrasado'|'em-breve', minutos } }
 *   atrasados: number            – quantos já passaram do horário
 * }}
 */
export function analisarLembretes(lista, agora = new Date()) {
  const hoje = dataParaISO(agora);
  const pendentesDeHoje = lista.filter(
    (agendamento) => agendamento.status === STATUS.AGENDADO && agendamento.data === hoje
  );

  const alertas = {};
  let proximo = null;
  let minutosProximo = null;
  let atrasados = 0;

  for (const agendamento of pendentesDeHoje) {
    const minutos = minutosAte(agendamento.data, agendamento.horario, agora);

    if (minutos < 0) {
      // Horário passou e continua "Agendado": atrasado
      atrasados += 1;
      alertas[agendamento.protocolo] = { tipo: 'atrasado', minutos: Math.abs(minutos) };
      continue; // pula para o próximo item do laço
    }

    if (minutos <= MINUTOS_LEMBRETE) {
      alertas[agendamento.protocolo] = { tipo: 'em-breve', minutos };
    }

    if (minutosProximo === null || minutos < minutosProximo) {
      proximo = agendamento;
      minutosProximo = minutos;
    }
  }

  return { proximo, minutosProximo, alertas, atrasados };
}
