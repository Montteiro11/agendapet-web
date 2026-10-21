// =========================================================
// ui.js – tudo que mexe na tela (DOM): criar, mostrar e esconder elementos.
// Regra do projeto: dados nunca entram com innerHTML, sempre textContent.
// =========================================================

// Formatador de dinheiro no padrão brasileiro: 60 -> "R$ 60,00"
const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatarMoeda(valor) {
  return formatadorMoeda.format(valor);
}

// 30 -> "30 min" | 90 -> "1 h 30 min" | 1440 -> "24 h"
export function formatarDuracao(minutos) {
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

// ---------- Elementos do catálogo ----------
// querySelector com atributo data-*: separa o "gancho" do JS das classes do CSS.
const statusCatalogo = document.querySelector('[data-catalogo-status]');
const listaCatalogo = document.querySelector('[data-catalogo-lista]');

/** Estado 1: carregando */
export function mostrarCatalogoCarregando() {
  statusCatalogo.classList.remove('catalogo__status--erro');
  statusCatalogo.textContent = 'Carregando serviços…';
  listaCatalogo.replaceChildren(); // esvazia a lista
}

/**
 * Estado 2: erro, com botão "Tentar novamente".
 * aoTentarNovamente é um CALLBACK: uma função que recebemos como
 * parâmetro e que só será executada quando o botão for clicado.
 */
export function mostrarCatalogoErro(mensagem, aoTentarNovamente) {
  const texto = document.createElement('span');
  texto.textContent = mensagem;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao';
  botao.textContent = 'Tentar novamente';
  botao.addEventListener('click', aoTentarNovamente);

  statusCatalogo.classList.add('catalogo__status--erro');
  statusCatalogo.replaceChildren(texto, botao);
  listaCatalogo.replaceChildren();
}

/** Estado 3: sucesso, desenha um cartão para cada serviço */
export function mostrarCatalogo(servicos) {
  statusCatalogo.classList.remove('catalogo__status--erro');
  statusCatalogo.textContent = `${servicos.length} serviços disponíveis.`;

  // map: transforma cada objeto "servico" em um elemento <li>
  const itens = servicos.map(criarItemServico);
  listaCatalogo.replaceChildren(...itens); // ... "espalha" o array em vários argumentos
}

// Monta um <li> como este:
// <li class="servico">
//   <h3 class="servico__nome">Banho</h3>
//   <p class="servico__detalhes">1 h · <span class="servico__preco">R$ 60,00</span></p>
//   <span class="etiqueta">Atende a domicílio</span>
// </li>
function criarItemServico(servico) {
  const item = document.createElement('li');
  item.classList.add('servico');

  const nome = document.createElement('h3');
  nome.classList.add('servico__nome');
  nome.textContent = servico.nome;

  const detalhes = document.createElement('p');
  detalhes.classList.add('servico__detalhes');
  detalhes.textContent = `${formatarDuracao(servico.duracaoMin)} · `;

  const preco = document.createElement('span');
  preco.classList.add('servico__preco');
  preco.textContent = formatarMoeda(servico.preco);
  detalhes.append(preco);

  item.append(nome, detalhes);

  if (servico.domiciliar) {
    const etiqueta = document.createElement('span');
    etiqueta.classList.add('etiqueta');
    etiqueta.textContent = 'Atende a domicílio';
    item.append(etiqueta);
  }

  return item;
}

// =========================================================
// Formulário de novo agendamento (US03)
// =========================================================

const formulario = document.querySelector('[data-form-agendamento]');
const resumoErros = document.querySelector('[data-form-resumo]');
const mensagemSucesso = document.querySelector('[data-form-sucesso]');
const campoServico = formulario.querySelector('[name="servico"]');
const campoData = formulario.querySelector('[name="data"]');

// "2026-10-22" -> "22/10/2026"
export function formatarData(textoISO) {
  const [ano, mes, dia] = textoISO.split('-'); // desestruturação de array
  return `${dia}/${mes}/${ano}`;
}

/** Devolve o elemento <form> para o app.js registrar o evento submit. */
export function obterFormulario() {
  return formulario;
}

/** Impede escolher datas passadas no calendário do navegador (atributo min). */
export function definirDataMinima(textoISO) {
  campoData.min = textoISO;
}

/**
 * Preenche o <select> de serviços com o catálogo (US02 alimenta a US03).
 * Se a lista vier vazia (erro no catálogo), avisa no próprio select.
 */
export function preencherServicos(servicos) {
  const primeira = document.createElement('option');
  primeira.value = '';
  primeira.textContent = servicos.length > 0 ? 'Selecione…' : 'Serviços indisponíveis';

  const opcoes = servicos.map((servico) => {
    const opcao = document.createElement('option');
    opcao.value = servico.id;
    opcao.textContent = `${servico.nome} – ${formatarMoeda(servico.preco)}`;
    return opcao;
  });

  campoServico.replaceChildren(primeira, ...opcoes);
  campoServico.disabled = servicos.length === 0;
}

/**
 * Lê todos os campos do formulário e devolve um objeto.
 * FormData pega os valores pelo atributo name de cada campo.
 * trim() tira espaços do começo e do fim.
 */
export function lerFormulario() {
  const dados = {};
  for (const [nome, valor] of new FormData(formulario)) {
    dados[nome] = typeof valor === 'string' ? valor.trim() : valor;
  }
  return dados;
}

/** Apaga todas as mensagens de erro e o destaque vermelho dos campos. */
export function limparErros() {
  resumoErros.textContent = '';
  formulario.querySelectorAll('[aria-invalid="true"]').forEach((campo) => {
    campo.removeAttribute('aria-invalid');
  });
  formulario.querySelectorAll('.campo__erro').forEach((paragrafo) => {
    paragrafo.textContent = '';
  });
}

/**
 * Mostra as mensagens de erro ao lado de cada campo
 * e move o foco para o PRIMEIRO campo inválido (na ordem da tela).
 */
export function mostrarErros(erros) {
  limparErros();

  const quantidade = Object.keys(erros).length;
  resumoErros.textContent = quantidade === 1
    ? 'Corrija 1 campo destacado para salvar.'
    : `Corrija os ${quantidade} campos destacados para salvar.`;

  // Percorre os campos na ordem em que aparecem no HTML
  const camposInvalidos = [...formulario.elements].filter((campo) => campo.name in erros);

  camposInvalidos.forEach((campo) => {
    campo.setAttribute('aria-invalid', 'true');
    const paragrafo = formulario.querySelector(`#erro-${campo.name}`);
    if (paragrafo) {
      paragrafo.textContent = erros[campo.name];
    }
  });

  if (camposInvalidos.length > 0) {
    camposInvalidos[0].focus();
  }
}

export function mostrarSucesso(texto) {
  mensagemSucesso.textContent = texto;
}

export function limparSucesso() {
  mensagemSucesso.textContent = '';
}

/** Volta o formulário ao estado inicial (campos vazios, sem erros). */
export function limparFormulario() {
  formulario.reset();
  limparErros();
  permitirDomiciliar(false); // sem serviço escolhido, domicílio volta a ficar bloqueado
}

// =========================================================
// Agenda simples (provisória até a US06)
// =========================================================

const agendaVazia = document.querySelector('[data-agenda-vazia]');
const agendaLista = document.querySelector('[data-agenda-lista]');

/**
 * Desenha a lista de agendamentos salvos.
 * Tudo com createElement + textContent (nada de innerHTML com dados digitados).
 */
export function mostrarAgenda(agendamentos) {
  agendaVazia.hidden = agendamentos.length > 0;

  const itens = agendamentos.map((agendamento) => {
    const item = document.createElement('li');
    item.classList.add('agenda-simples__item');
    item.textContent =
      `${formatarData(agendamento.data)} às ${agendamento.horario} – ` +
      `${agendamento.pet} (${agendamento.nomeServico}) · tutor: ${agendamento.tutor}` +
      (agendamento.domiciliar === 'on' ? ` · a domicílio (${agendamento.bairro})` : '');
    return item;
  });

  agendaLista.replaceChildren(...itens);
}

// =========================================================
// Atendimento a domicílio e endereço por CEP (US04)
// =========================================================

const campoDomiciliar = formulario.querySelector('[name="domiciliar"]');
const grupoEndereco = formulario.querySelector('[data-endereco]');
const campoCep = formulario.querySelector('[name="cep"]');
const statusCep = formulario.querySelector('[data-cep-status]');

/** Liga/desliga o checkbox "Atendimento a domicílio" conforme o serviço. */
export function permitirDomiciliar(permitido) {
  campoDomiciliar.disabled = !permitido;
  if (!permitido) {
    campoDomiciliar.checked = false;
    mostrarEndereco(false);
  }
}

/** Domicílio está marcado? */
export function domiciliarMarcado() {
  return campoDomiciliar.checked;
}

/**
 * Mostra ou esconde os campos de endereço.
 * disabled = true tira os campos do envio (FormData ignora campos desabilitados).
 */
export function mostrarEndereco(visivel) {
  grupoEndereco.hidden = !visivel;
  grupoEndereco.disabled = !visivel;
  if (!visivel) {
    mostrarStatusCep('', 'neutro');
  }
}

/**
 * Coloca o hífen enquanto a pessoa digita: "01001000" -> "01001-000".
 * Devolve só os números, para o app.js decidir se já pode buscar.
 */
export function formatarCampoCep() {
  const digitos = campoCep.value.replace(/\D/g, '').slice(0, 8);
  campoCep.value = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
  return digitos;
}

/**
 * Mensagem embaixo do CEP. tipo: 'carregando' | 'sucesso' | 'erro' | 'neutro'.
 * A classe muda a cor (ver style.css).
 */
export function mostrarStatusCep(texto, tipo) {
  statusCep.textContent = texto;
  statusCep.classList.remove('campo__status--erro', 'campo__status--sucesso');
  if (tipo === 'erro') statusCep.classList.add('campo__status--erro');
  if (tipo === 'sucesso') statusCep.classList.add('campo__status--sucesso');
}

/**
 * Preenche rua, bairro, cidade e UF com o que veio do ViaCEP
 * e leva o foco para o "Número" (que a pessoa precisa digitar).
 */
export function preencherEndereco(endereco) {
  for (const campo of ['logradouro', 'bairro', 'cidade', 'uf']) {
    formulario.querySelector(`[name="${campo}"]`).value = endereco[campo] ?? '';
  }
  formulario.querySelector('[name="numero"]').focus();
}
