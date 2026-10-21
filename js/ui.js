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
