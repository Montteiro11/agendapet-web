// =========================================================
// tests/dominio.test.js – testes automáticos do domínio (bônus).
// Rodar com:  npm test
//
// node:test e node:assert já vêm com o Node: não precisa instalar nada.
// Cada test() descreve um cenário de aceite da US07 e confere o resultado.
// =========================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  Agendamento,
  AgendamentoDomiciliar,
  criarAgendamento,
  criarGeradorDeProtocolo,
  TAXA_DESLOCAMENTO,
  STATUS,
} from '../js/dominio/agendamento.js';
import { haConflito, encontrarConflito, filtrarAgendamentos, filtrarAgenda } from '../js/dominio/regras.js';
import { calcularFechamento } from '../js/dominio/fechamento.js';
import { analisarLembretes, minutosAte } from '../js/dominio/lembretes.js';

// Dados base reaproveitados nos testes
const base = {
  tutor: 'Ana Souza',
  telefone: '48999991234',
  pet: 'Rex',
  especie: 'Cão',
  servicoId: 'banho',
  nomeServico: 'Banho',
  preco: 60,
  data: '2026-10-23',
  horario: '10:00',
};

const endereco = {
  cep: '01001000',
  logradouro: 'Praça da Sé',
  numero: '100',
  complemento: '',
  bairro: 'Sé',
  cidade: 'São Paulo',
  uf: 'SP',
};

test('domiciliar: valor inclui a taxa e o resumo mostra o endereço', () => {
  const visita = new AgendamentoDomiciliar({ ...base, protocolo: 'AP-0001', endereco });

  assert.ok(visita instanceof Agendamento, 'a subclasse também é um Agendamento');
  assert.equal(visita.calcularValor(), 60 + TAXA_DESLOCAMENTO);
  assert.match(visita.resumo(), /Praça da Sé, 100/);
});

test('loja: valor é só o preço do serviço', () => {
  const banho = new Agendamento({ ...base, protocolo: 'AP-0001' });
  assert.equal(banho.calcularValor(), 60);
});

test('conflito: não permite dois agendamentos ativos no mesmo dia e horário', () => {
  const lista = [new Agendamento({ ...base, protocolo: 'AP-0001' })];

  assert.equal(haConflito(lista, '2026-10-23', '10:00'), true);
  assert.equal(encontrarConflito(lista, '2026-10-23', '10:00').protocolo, 'AP-0001');
  assert.equal(haConflito(lista, '2026-10-23', '11:00'), false);
});

test('conflito: horário de um cancelado fica livre', () => {
  const cancelado = new Agendamento({ ...base, protocolo: 'AP-0001' });
  cancelado.cancelar();
  assert.equal(haConflito([cancelado], '2026-10-23', '10:00'), false);
});

test('protocolo: três agendamentos geram AP-0001, AP-0002 e AP-0003', () => {
  const gerar = criarGeradorDeProtocolo();
  assert.deepEqual([gerar(), gerar(), gerar()], ['AP-0001', 'AP-0002', 'AP-0003']);
});

test('protocolo: cada gerador tem o seu próprio contador (closure)', () => {
  const gerarA = criarGeradorDeProtocolo();
  const gerarB = criarGeradorDeProtocolo(41);
  gerarA();
  assert.equal(gerarA(), 'AP-0002');
  assert.equal(gerarB(), 'AP-0042');
});

test('status: concluir e cancelar só valem para Agendado', () => {
  const banho = new Agendamento({ ...base, protocolo: 'AP-0001' });
  banho.concluir();
  assert.equal(banho.status, STATUS.CONCLUIDO);
  assert.throws(() => banho.cancelar());
});

test('callback: filtrarAgendamentos usa a função critério recebida', () => {
  const lista = [
    new Agendamento({ ...base, protocolo: 'AP-0001', pet: 'Rex' }),
    new Agendamento({ ...base, protocolo: 'AP-0002', pet: 'Mia', horario: '11:00' }),
  ];
  const soMia = filtrarAgendamentos(lista, (agendamento) => agendamento.pet === 'Mia');
  assert.equal(soMia.length, 1);
  assert.equal(soMia[0].protocolo, 'AP-0002');
});

test('fechamento: faturamento soma só os concluídos, com contagem por serviço e cancelados', () => {
  const gerar = criarGeradorDeProtocolo();
  const lista = [
    new Agendamento({ ...base, protocolo: gerar(), horario: '08:00' }),                                  // Banho 60 -> concluído
    new AgendamentoDomiciliar({ ...base, protocolo: gerar(), horario: '09:00', endereco }),             // Banho 60 + 20 -> concluído
    new Agendamento({ ...base, protocolo: gerar(), horario: '10:00', servicoId: 'tosa', nomeServico: 'Tosa', preco: 80 }), // cancelado
    new Agendamento({ ...base, protocolo: gerar(), horario: '11:00', servicoId: 'tosa', nomeServico: 'Tosa', preco: 80 }), // agendado
    new Agendamento({ ...base, protocolo: gerar(), data: '2026-10-24' }),                               // outro dia
  ];
  lista[0].concluir();
  lista[1].concluir();
  lista[2].cancelar();

  // "agora" fixo: 23/10/2026 às 09:30
  const resumo = calcularFechamento(lista, '2026-10-23', new Date(2026, 9, 23, 9, 30));

  assert.equal(resumo.faturamento, 60 + 80);          // só os 2 concluídos
  assert.equal(resumo.cancelados, 1);
  assert.equal(resumo.totalAtendimentos, 3);          // sem o cancelado
  assert.deepEqual(resumo.porServico, { Banho: 2, Tosa: 1 });
  assert.equal(resumo.previsto, 80);                  // a tosa das 11:00
  assert.equal(resumo.proximo.protocolo, 'AP-0004');
  assert.equal(resumo.diaEncerrado, false);
});

test('fábrica: criarAgendamento escolhe a classe pelo tipo (dados vindos de JSON)', () => {
  const visita = new AgendamentoDomiciliar({ ...base, protocolo: 'AP-0007', endereco });
  const copia = criarAgendamento(JSON.parse(JSON.stringify(visita)));

  assert.ok(copia instanceof AgendamentoDomiciliar);
  assert.equal(copia.calcularValor(), visita.calcularValor());
});

test('agenda (US06): fica ordenada por data e horário', () => {
  const lista = [
    new Agendamento({ ...base, protocolo: 'AP-0001', horario: '11:00' }),
    new Agendamento({ ...base, protocolo: 'AP-0002', horario: '09:00' }),
    new Agendamento({ ...base, protocolo: 'AP-0003', data: '2026-10-22', horario: '15:00' }),
  ];
  const ordem = filtrarAgenda(lista).map((agendamento) => agendamento.protocolo);
  assert.deepEqual(ordem, ['AP-0003', 'AP-0002', 'AP-0001']);
});

test('agenda (US06): busca por tutor ou pet, sem diferenciar maiúscula e acento, e filtra por status', () => {
  const lista = [
    new Agendamento({ ...base, protocolo: 'AP-0001', pet: 'Pântufa', tutor: 'Ana' }),
    new Agendamento({ ...base, protocolo: 'AP-0002', pet: 'Rex', tutor: 'Bruno', horario: '11:00' }),
  ];
  lista[1].cancelar();

  assert.equal(filtrarAgenda(lista, { busca: 'PANTUFA' }).length, 1);
  assert.equal(filtrarAgenda(lista, { busca: 'brun' })[0].protocolo, 'AP-0002');
  assert.equal(filtrarAgenda(lista, { status: 'Cancelado' }).length, 1);
  assert.equal(filtrarAgenda(lista, { status: 'Agendado', busca: 'rex' }).length, 0);
});

test('lembretes (US09): próximo atendimento, lembrete a 15 min ou menos e atrasados', () => {
  const lista = [
    new Agendamento({ ...base, protocolo: 'AP-0001', horario: '09:00' }), // já passou -> atrasado
    new Agendamento({ ...base, protocolo: 'AP-0002', horario: '10:10' }), // faltam 10 min -> em breve
    new Agendamento({ ...base, protocolo: 'AP-0003', horario: '11:00' }), // faltam 60 min
    new Agendamento({ ...base, protocolo: 'AP-0004', horario: '08:00' }), // concluído: não entra
  ];
  lista[3].concluir();

  // "agora" fixo: 23/10/2026 às 10:00
  const resultado = analisarLembretes(lista, new Date(2026, 9, 23, 10, 0));

  assert.equal(resultado.proximo.protocolo, 'AP-0002');
  assert.equal(resultado.minutosProximo, 10);
  assert.deepEqual(resultado.alertas['AP-0001'], { tipo: 'atrasado', minutos: 60 });
  assert.deepEqual(resultado.alertas['AP-0002'], { tipo: 'em-breve', minutos: 10 });
  assert.equal(resultado.alertas['AP-0003'], undefined);
  assert.equal(resultado.atrasados, 1);
});

test('lembretes (US09): minutosAte calcula a diferença em minutos', () => {
  assert.equal(minutosAte('2026-10-23', '10:30', new Date(2026, 9, 23, 10, 0)), 30);
  assert.equal(minutosAte('2026-10-23', '09:45', new Date(2026, 9, 23, 10, 0)), -15);
});
