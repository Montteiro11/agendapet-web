// =========================================================
// app.js – ponto de entrada do navegador.
// Ele não desenha nada sozinho: chama a api.js para buscar dados,
// a dominio/regras.js para validar e a ui.js para mostrar na tela.
// =========================================================

import { buscarServicos, buscarEndereco } from './api.js';
import { validarAgendamento, dataParaISO } from './dominio/regras.js';
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
} from './ui.js';

// Lista de serviços vinda do catálogo (US02).
// Usada também no <select> do formulário (US03).
let servicos = [];

// Agendamentos salvos nesta sessão.
// const: a variável sempre aponta para o MESMO array,
// mas o conteúdo do array pode mudar (push).
const agendamentos = [];

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

function aoEnviarFormulario(evento) {
  // Sem isso, o navegador recarregaria a página e perderíamos tudo.
  evento.preventDefault();
  limparSucesso();

  const dados = lerFormulario();
  const erros = validarAgendamento(dados);

  // Object.keys devolve a lista de campos com erro. Se tiver algum, para aqui.
  if (Object.keys(erros).length > 0) {
    mostrarErros(erros);
    return;
  }

  // find: procura o serviço escolhido para guardar o nome junto
  const servico = servicos.find((item) => item.id === dados.servico);

  // Spread (...dados) copia todos os campos e acrescenta os novos.
  // O status inicial é sempre "Agendado" (Concluído/Cancelado vêm na US06).
  const agendamento = {
    ...dados,
    nomeServico: servico ? servico.nome : dados.servico,
    status: 'Agendado',
  };

  agendamentos.push(agendamento);
  mostrarAgenda(agendamentos);

  limparFormulario();
  mostrarSucesso(
    `Agendamento salvo: ${agendamento.pet} em ${formatarData(agendamento.data)} às ${agendamento.horario}.`
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
// Início
// ---------------------------------------------------------

definirDataMinima(dataParaISO(new Date()));
mostrarAgenda(agendamentos);
carregarCatalogo();
