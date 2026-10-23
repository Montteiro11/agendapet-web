// =========================================================
// app.js – ponto de entrada do navegador.
// Ele não desenha nada sozinho: chama a api.js para buscar dados,
// a dominio/regras.js para validar e a ui.js para mostrar na tela.
// =========================================================

import { buscarServicos, buscarEndereco, buscarFeriados } from './api.js';
import { validarAgendamento, dataParaISO, encontrarConflito, filtrarAgenda } from './dominio/regras.js';
import { criarAgendamento, criarGeradorDeProtocolo } from './dominio/agendamento.js';
import { calcularFechamento } from './dominio/fechamento.js';
import {
  mostrarCatalogoCarregando,
  mostrarCatalogoErro,
  mostrarCatalogo,
  obterFormulario,
  definirDataMinima,
  preencherServicos,
  lerFormulario,
  mostrarErros,
  mostrarSucesso,
  limparSucesso,
  limparFormulario,
  mostrarAgenda,
  formatarData,
  permitirDomiciliar,
  domiciliarMarcado,
  mostrarEndereco,
  formatarCampoCep,
  mostrarStatusCep,
  preencherEndereco,
  mostrarStatusFeriado,
  pedirConfirmacaoFeriado,
  obterCampoDiaFechamento,
  definirDiaFechamento,
  mostrarFechamento,
  obterControlesAgenda,
  destacarItem,
  focarItem,
  focarBusca,
  limparBusca,
  focarFormulario,
  mostrarExportacao,
  copiarExportacao,
  baixarExportacao,
} from './ui.js';

// Lista de serviços vinda do catálogo (US02).
// Usada também no <select> do formulário (US03).
let servicos = [];

// Agendamentos salvos nesta sessão (instâncias de Agendamento/AgendamentoDomiciliar).
// const: a variável sempre aponta para o MESMO array,
// mas o conteúdo do array pode mudar (push).
const agendamentos = [];

// Gerador de protocolos AP-0001, AP-0002... (closure, ver dominio/agendamento.js)
const gerarProtocolo = criarGeradorDeProtocolo();

// ---------------------------------------------------------
// Catálogo (US02)
// ---------------------------------------------------------

/**
 * Carrega o catálogo tratando os três estados exigidos na US02:
 * carregando -> sucesso  OU  carregando -> erro (com "Tentar novamente").
 */
async function carregarCatalogo() {
  mostrarCatalogoCarregando();

  try {
    servicos = await buscarServicos();
    mostrarCatalogo(servicos);
    preencherServicos(servicos);
  } catch (erro) {
    // console.warn (amarelo) em vez de deixar o erro "estourar" vermelho no console
    console.warn('[AgendaPet] Falha ao carregar o catálogo:', erro.message);
    preencherServicos([]);
    // Passamos a própria função carregarCatalogo como callback do botão
    mostrarCatalogoErro('Não conseguimos carregar os serviços.', carregarCatalogo);
  }
}

// ---------------------------------------------------------
// Formulário de novo agendamento (US03)
// ---------------------------------------------------------

const formulario = obterFormulario();

async function aoEnviarFormulario(evento) {
  // Sem isso, o navegador recarregaria a página e perderíamos tudo.
  evento.preventDefault();
  limparSucesso();

  // Se a verificação de feriado ainda está em andamento, espera ela terminar
  // (senão daria para salvar um feriado sem a confirmação).
  await verificacaoFeriado;

  const dados = lerFormulario();
  const erros = validarAgendamento(dados, { feriado: feriadoDaData });

  // Object.keys devolve a lista de campos com erro. Se tiver algum, para aqui.
  if (Object.keys(erros).length > 0) {
    mostrarErros(erros);
    return;
  }

  // US07: não permite dois agendamentos ativos no mesmo dia e horário
  const conflito = encontrarConflito(agendamentos, dados.data, dados.horario);
  if (conflito) {
    mostrarErros({
      horario: `Horário ocupado: ${conflito.protocolo} (${conflito.pet}) já está marcado para ${formatarData(dados.data)} às ${dados.horario}.`,
    });
    return;
  }

  // find: procura o serviço escolhido para guardar nome e preço junto
  const servico = servicos.find((item) => item.id === dados.servico);

  // Monta os dados no formato das classes do domínio (US07)
  const dadosAgendamento = {
    protocolo: gerarProtocolo(),
    tutor: dados.tutor,
    telefone: dados.telefone,
    pet: dados.pet,
    especie: dados.especie,
    servicoId: dados.servico,
    nomeServico: servico ? servico.nome : dados.servico,
    preco: servico ? servico.preco : 0,
    data: dados.data,
    horario: dados.horario,
    observacoes: dados.observacoes ?? '',
  };

  // Só no atendimento a domicílio: acrescenta o endereço
  if (dados.domiciliar === 'on') {
    dadosAgendamento.endereco = {
      cep: dados.cep,
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento ?? '',
      bairro: dados.bairro,
      cidade: dados.cidade,
      uf: dados.uf.toUpperCase(),
    };
  }

  // A fábrica escolhe a classe: Agendamento ou AgendamentoDomiciliar
  const agendamento = criarAgendamento(dadosAgendamento);

  agendamentos.push(agendamento);
  atualizarAgenda();
  atualizarFechamento();

  limparFormulario();
  feriadoDaData = null;
  mostrarSucesso(
    `Agendamento ${agendamento.protocolo} salvo: ${agendamento.pet} em ${formatarData(agendamento.data)} às ${agendamento.horario}.`
  );
}

formulario.addEventListener('submit', aoEnviarFormulario);

// Ao começar a preencher de novo, a mensagem de sucesso antiga some.
formulario.addEventListener('input', limparSucesso);

// ---------------------------------------------------------
// Atendimento a domicílio e CEP (US04)
// ---------------------------------------------------------

const campoServico = formulario.querySelector('[name="servico"]');
const campoDomiciliar = formulario.querySelector('[name="domiciliar"]');
const campoCep = formulario.querySelector('[name="cep"]');

// Trocou o serviço: só libera "domicílio" se o serviço permitir.
campoServico.addEventListener('change', () => {
  const servico = servicos.find((item) => item.id === campoServico.value);
  // ?. (optional chaining): se servico for undefined, não dá erro, vira undefined
  permitirDomiciliar(servico?.domiciliar === true);
});

// Marcou/desmarcou "Atendimento a domicílio": mostra/esconde o endereço.
campoDomiciliar.addEventListener('change', () => {
  mostrarEndereco(domiciliarMarcado());
});

// Guarda qual CEP estamos buscando, para ignorar respostas atrasadas
// (se a pessoa trocar o CEP antes da primeira resposta chegar).
let cepEmBusca = '';

async function consultarCep(cep) {
  cepEmBusca = cep;
  mostrarStatusCep('Buscando endereço…', 'carregando');

  try {
    const endereco = await buscarEndereco(cep);
    if (cep !== cepEmBusca) return; // chegou uma resposta velha: ignora
    preencherEndereco(endereco);
    mostrarStatusCep('Endereço encontrado. Confira e digite o número.', 'sucesso');
  } catch (erro) {
    if (cep !== cepEmBusca) return;
    console.warn(`[AgendaPet] CEP ${cep}: ${erro.tipo ?? 'erro'}`);
    // Cada tipo de erro já vem com sua mensagem (ver api.js).
    // Os campos continuam liberados: a pessoa pode digitar o endereço à mão.
    mostrarStatusCep(erro.message, 'erro');
  }
}

// A cada tecla: formata com hífen e, ao completar 8 números, consulta.
campoCep.addEventListener('input', () => {
  const digitos = formatarCampoCep();
  if (digitos.length === 8) {
    consultarCep(digitos);
  } else {
    cepEmBusca = '';
    mostrarStatusCep('', 'neutro');
  }
});

// Saiu do campo com o CEP incompleto: avisa que o formato está errado.
campoCep.addEventListener('blur', () => {
  const digitos = formatarCampoCep();
  if (digitos.length > 0 && digitos.length < 8) {
    mostrarStatusCep('CEP inválido: digite os 8 números (ex.: 88000-000).', 'erro');
  }
});

// ---------------------------------------------------------
// Alerta de feriados (US05)
// ---------------------------------------------------------

const campoData = formulario.querySelector('[name="data"]');

// Nome do feriado da data escolhida (ou null se não for feriado)
let feriadoDaData = null;

// Promise da verificação atual. Começa já resolvida (nada para esperar).
let verificacaoFeriado = Promise.resolve();

async function verificarFeriado(data) {
  feriadoDaData = null;
  pedirConfirmacaoFeriado(false);

  if (!data) {
    mostrarStatusFeriado('', 'neutro');
    return;
  }

  mostrarStatusFeriado('Verificando feriados…', 'carregando');
  const ano = data.slice(0, 4); // "2026-12-25" -> "2026"

  try {
    const feriados = await buscarFeriados(ano);
    if (campoData.value !== data) return; // a data mudou enquanto esperávamos

    const feriado = feriados.find((item) => item.date === data);
    if (feriado) {
      feriadoDaData = feriado.name;
      mostrarStatusFeriado(`Atenção: ${formatarData(data)} é feriado (${feriado.name}). Confirme com o tutor.`, 'aviso');
      pedirConfirmacaoFeriado(true);
    } else {
      mostrarStatusFeriado('', 'neutro');
    }
  } catch (erro) {
    if (campoData.value !== data) return;
    console.warn('[AgendaPet] Falha ao consultar feriados:', erro.message);
    // A API falhou: avisa, mas deixa continuar (feriadoDaData fica null).
    mostrarStatusFeriado('Não foi possível verificar feriados agora. Você pode continuar o agendamento.', 'erro');
  }
}

campoData.addEventListener('change', () => {
  // Guardamos a Promise para o submit poder esperar por ela (await).
  verificacaoFeriado = verificarFeriado(campoData.value);
});

// ---------------------------------------------------------
// Agenda do dia (US06)
// ---------------------------------------------------------

const controles = obterControlesAgenda();

// Estado da agenda: o que está filtrado e qual item está selecionado
const estadoAgenda = {
  busca: '',
  status: 'Todos',
  selecionado: null, // protocolo do item selecionado, ex.: "AP-0002"
};

/** Filtra, ordena (dominio/regras.js) e desenha (ui.js). */
function atualizarAgenda() {
  const visiveis = filtrarAgenda(agendamentos, estadoAgenda);
  mostrarAgenda(visiveis, { total: agendamentos.length, selecionado: estadoAgenda.selecionado });
}

/** Clicou (ou apertou Enter/Espaço) num item: seleciona; de novo, tira a seleção. */
function alternarSelecao(protocolo) {
  estadoAgenda.selecionado = estadoAgenda.selecionado === protocolo ? null : protocolo;
  atualizarAgenda();
  focarItem(protocolo);
}

/** Botões Concluir e Cancelar: chamam o método da classe (this = aquele agendamento). */
function executarAcao(acao, protocolo) {
  const agendamento = agendamentos.find((item) => item.protocolo === protocolo);
  if (!agendamento) return;

  try {
    if (acao === 'concluir') {
      agendamento.concluir();
    } else if (acao === 'cancelar') {
      agendamento.cancelar();
    }
  } catch (erro) {
    console.warn('[AgendaPet]', erro.message);
  }

  atualizarAgenda();
  atualizarFechamento(); // o faturamento muda quando alguém é concluído
  focarItem(protocolo);
}

// ----- Mouse: UM listener na lista inteira (delegação de eventos) -----
// Em vez de colocar um evento em cada item, a lista escuta tudo e
// descobre, com closest(), em qual item ou botão o clique aconteceu.

controles.lista.addEventListener('click', (evento) => {
  const botao = evento.target.closest('button[data-acao]');
  const item = evento.target.closest('.agenda__item');
  if (!item) return;

  if (botao) {
    executarAcao(botao.dataset.acao, item.dataset.protocolo);
  } else {
    alternarSelecao(item.dataset.protocolo);
  }
});

// mouseover/mouseout: destaque ao passar o mouse
controles.lista.addEventListener('mouseover', (evento) => {
  const item = evento.target.closest('.agenda__item');
  if (item) destacarItem(item, true);
});

controles.lista.addEventListener('mouseout', (evento) => {
  const item = evento.target.closest('.agenda__item');
  // relatedTarget = para onde o mouse foi. Se ainda está dentro do item, mantém o destaque.
  if (item && !item.contains(evento.relatedTarget)) destacarItem(item, false);
});

// ----- Teclado no item: Enter ou Espaço selecionam (os botões já funcionam sozinhos) -----
controles.lista.addEventListener('keydown', (evento) => {
  const ehItem = evento.target.classList.contains('agenda__item');
  if (ehItem && (evento.key === 'Enter' || evento.key === ' ')) {
    evento.preventDefault(); // o Espaço não rola a página
    alternarSelecao(evento.target.dataset.protocolo);
  }
});

// ----- Busca em tempo real: o evento "input" dispara a cada letra -----
controles.busca.addEventListener('input', () => {
  estadoAgenda.busca = controles.busca.value;
  atualizarAgenda();
});

// ----- Filtro por status -----
controles.filtroStatus.addEventListener('change', () => {
  estadoAgenda.status = controles.filtroStatus.value;
  atualizarAgenda();
});

// ----- Atalhos globais: N, / e Esc -----
document.addEventListener('keydown', (evento) => {
  // Ctrl/Alt/Cmd + tecla são atalhos do navegador: não mexemos
  if (evento.ctrlKey || evento.altKey || evento.metaKey) return;

  if (evento.key === 'Escape') {
    if (estadoAgenda.busca !== '') {
      limparBusca();
      estadoAgenda.busca = '';
      atualizarAgenda();
    }
    return;
  }

  // Se a pessoa está digitando num campo, "n" e "/" são letras normais
  const digitando = evento.target.closest('input, textarea, select, [contenteditable="true"]');
  if (digitando) return;

  if (evento.key === 'n' || evento.key === 'N') {
    evento.preventDefault();
    focarFormulario();
  } else if (evento.key === '/') {
    evento.preventDefault(); // no Firefox, "/" abriria a busca da página
    focarBusca();
  }
});

// ----- Exportar agenda -----
// JSON.stringify chama o toJSON() de cada agendamento (dominio/agendamento.js).
// null, 2 = formatado com 2 espaços, fácil de ler. É o formato lido pelos scripts de Node (US11).
controles.botaoExportar.addEventListener('click', () => {
  mostrarExportacao(JSON.stringify(ordenarParaExportar(), null, 2));
});

function ordenarParaExportar() {
  return filtrarAgenda(agendamentos, { status: 'Todos', busca: '' });
}

controles.botaoCopiar.addEventListener('click', copiarExportacao);

controles.botaoBaixar.addEventListener('click', () => {
  baixarExportacao(`agenda-agendapet-${dataParaISO(new Date())}.json`);
});

// ---------------------------------------------------------
// Fechamento do dia (US07)
// ---------------------------------------------------------

const campoDiaFechamento = obterCampoDiaFechamento();

function atualizarFechamento() {
  const dia = campoDiaFechamento.value || dataParaISO(new Date());
  mostrarFechamento(calcularFechamento(agendamentos, dia));
}

campoDiaFechamento.addEventListener('change', atualizarFechamento);

// ---------------------------------------------------------
// Início
// ---------------------------------------------------------

definirDataMinima(dataParaISO(new Date()));
definirDiaFechamento(dataParaISO(new Date()));
atualizarAgenda();
atualizarFechamento();
carregarCatalogo();
