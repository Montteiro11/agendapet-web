// =========================================================
// app.js – ponto de entrada do navegador.
// Ele não desenha nada sozinho: chama a api.js para buscar dados,
// a dominio/regras.js para validar e a ui.js para mostrar na tela.
// =========================================================

import { buscarServicos } from './api.js';
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
// Início
// ---------------------------------------------------------

definirDataMinima(dataParaISO(new Date()));
mostrarAgenda(agendamentos);
carregarCatalogo();
