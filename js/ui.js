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
  mostrarStatusFeriado('', 'neutro');
  pedirConfirmacaoFeriado(false);
}

// =========================================================
// Agenda do dia (US06)
// =========================================================

const agendaVazia = document.querySelector('[data-agenda-vazia]');
const agendaLista = document.querySelector('[data-agenda-lista]');
const agendaContador = document.querySelector('[data-agenda-contador]');
const campoBusca = document.querySelector('[data-agenda-busca]');
const campoFiltroStatus = document.querySelector('[data-agenda-filtro]');
const botaoExportar = document.querySelector('[data-exportar]');
const botaoCopiar = document.querySelector('[data-copiar]');
const botaoBaixar = document.querySelector('[data-baixar]');
const areaExportacao = document.querySelector('[data-exportacao]');
const textoExportacao = document.querySelector('[data-exportacao-texto]');
const statusExportacao = document.querySelector('[data-exportacao-status]');

/** Entrega ao app.js os elementos que recebem eventos. */
export function obterControlesAgenda() {
  return {
    lista: agendaLista,
    busca: campoBusca,
    filtroStatus: campoFiltroStatus,
    botaoExportar,
    botaoCopiar,
    botaoBaixar,
  };
}

/**
 * Status -> pedaço do nome da classe CSS.
 * switch: escolhe um caminho conforme o valor (alternativa a vários if-else).
 */
function classeDoStatus(status) {
  switch (status) {
    case 'Concluído':
      return 'concluido';
    case 'Cancelado':
      return 'cancelado';
    default:
      return 'agendado';
  }
}

/** Atalho para criar um elemento já com classe e texto. */
function criarElemento(tag, classe, texto = '') {
  const elemento = document.createElement(tag);
  elemento.classList.add(classe);
  elemento.textContent = texto;
  return elemento;
}

/**
 * Monta um <li> da agenda. Exemplo do resultado:
 * <li class="agenda__item agenda__item--agendado" tabindex="0" data-protocolo="AP-0001">
 *   <p class="agenda__quando">30/10/2026 · 09:00 · AP-0001</p>
 *   <p class="agenda__resumo">Rex (Banho) · tutor: Ana</p>
 *   <p class="agenda__valor">R$ 60,00</p>
 *   <span class="status status--agendado">Agendado</span>
 *   <p class="agenda__detalhes">…só aparece quando o item está selecionado…</p>
 *   <div class="agenda__acoes"><button>Concluir</button><button>Cancelar</button></div>
 * </li>
 */
function criarItemAgenda(agendamento, selecionado, alerta) {
  const item = document.createElement('li');
  item.classList.add('agenda__item', `agenda__item--${classeDoStatus(agendamento.status)}`);
  if (selecionado) {
    item.classList.add('agenda__item--selecionado');
  }
  // dataset.protocolo vira o atributo data-protocolo="AP-0001": é assim que
  // o app.js descobre em qual agendamento a pessoa clicou.
  item.dataset.protocolo = agendamento.protocolo;
  item.tabIndex = 0; // o item pode receber foco com Tab
  item.setAttribute('aria-label', `${agendamento.protocolo}, ${agendamento.pet}, ${agendamento.status}. Enter para ver detalhes.`);

  const quando = criarElemento('p', 'agenda__quando',
    `${formatarData(agendamento.data)} · ${agendamento.horario} · ${agendamento.protocolo}`);
  const resumo = criarElemento('p', 'agenda__resumo', agendamento.resumo());
  const valor = criarElemento('p', 'agenda__valor', formatarMoeda(agendamento.calcularValor()));
  const status = criarElemento('span', 'status', agendamento.status);
  status.classList.add(`status--${classeDoStatus(agendamento.status)}`);

  item.append(quando, resumo, valor, status);

  // US09: lembrete visual (a 15 min ou menos) ou atraso
  if (alerta) {
    const texto = alerta.tipo === 'atrasado'
      ? `Atrasado há ${alerta.minutos} min`
      : alerta.minutos === 0 ? 'É agora!' : `Em ${alerta.minutos} min`;
    const etiqueta = criarElemento('span', 'alerta', texto);
    etiqueta.classList.add(`alerta--${alerta.tipo}`);
    item.classList.add(`agenda__item--${alerta.tipo}`);
    item.append(etiqueta);
  }

  // Detalhes: só para o item selecionado
  if (selecionado) {
    const partes = [`Telefone: ${agendamento.telefone}`, `Espécie: ${agendamento.especie}`];
    if (agendamento.observacoes) {
      partes.push(`Obs.: ${agendamento.observacoes}`);
    }
    item.append(criarElemento('p', 'agenda__detalhes', partes.join(' · ')));
  }

  // Botões só para quem ainda está "Agendado"
  if (agendamento.status === 'Agendado') {
    const acoes = criarElemento('div', 'agenda__acoes');

    const concluir = criarElemento('button', 'botao', 'Concluir');
    concluir.type = 'button';
    concluir.dataset.acao = 'concluir';
    concluir.setAttribute('aria-label', `Concluir ${agendamento.protocolo} (${agendamento.pet})`);

    const cancelar = criarElemento('button', 'botao', 'Cancelar');
    cancelar.classList.add('botao--perigo');
    cancelar.type = 'button';
    cancelar.dataset.acao = 'cancelar';
    cancelar.setAttribute('aria-label', `Cancelar ${agendamento.protocolo} (${agendamento.pet})`);

    acoes.append(concluir, cancelar);
    item.append(acoes);
  }

  return item;
}

/**
 * Desenha a agenda.
 * @param {Agendamento[]} visiveis – já filtrados e ordenados (dominio/regras.js)
 * @param {{ total: number, selecionado: string|null }} info
 */
export function mostrarAgenda(visiveis, { total, selecionado, alertas = {} }) {
  const quantidade = visiveis.length;
  const texto = quantidade === 1 ? '1 agendamento' : `${quantidade} agendamentos`;
  // Se algum filtro escondeu itens, mostra também o total
  agendaContador.textContent = quantidade < total ? `${texto} (de ${total})` : texto;

  agendaVazia.hidden = quantidade > 0;
  agendaVazia.textContent = total === 0
    ? 'Nenhum agendamento ainda.'
    : 'Nenhum agendamento encontrado para essa busca ou filtro.';

  // Guarda qual item estava com o foco: redesenhar a lista apagaria o foco
  // (importante porque o relógio redesenha a cada 30 segundos, US09)
  const protocoloComFoco = document.activeElement?.closest?.('.agenda__item')?.dataset.protocolo;

  const itens = visiveis.map((agendamento) =>
    criarItemAgenda(agendamento, agendamento.protocolo === selecionado, alertas[agendamento.protocolo])
  );
  agendaLista.replaceChildren(...itens);

  if (protocoloComFoco) {
    focarItem(protocoloComFoco);
  }
}

/** Destaque ao passar o mouse (ou ao receber foco pelo teclado). */
export function destacarItem(item, ativo) {
  item.classList.toggle('agenda__item--destaque', ativo);
}

/** Devolve o foco a um item depois de redesenhar a lista. */
export function focarItem(protocolo) {
  const item = agendaLista.querySelector(`[data-protocolo="${protocolo}"]`);
  if (item) {
    item.focus();
  }
}

// ---------- Atalhos de teclado ----------

export function focarBusca() {
  campoBusca.focus();
  campoBusca.select();
}

export function limparBusca() {
  campoBusca.value = '';
}

/** Atalho "N": rola até o formulário e coloca o cursor no primeiro campo. */
export function focarFormulario() {
  const primeiroCampo = formulario.querySelector('[name="tutor"]');
  primeiroCampo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  primeiroCampo.focus({ preventScroll: true });
}

// ---------- Exportar agenda ----------

export function mostrarExportacao(json) {
  areaExportacao.hidden = false;
  textoExportacao.value = json;
  statusExportacao.textContent = '';
  textoExportacao.focus();
  textoExportacao.select();
}

/** Copia o JSON. Se o navegador bloquear a área de transferência, deixa o texto selecionado. */
export async function copiarExportacao() {
  try {
    await navigator.clipboard.writeText(textoExportacao.value);
    statusExportacao.textContent = 'JSON copiado!';
  } catch {
    textoExportacao.select();
    statusExportacao.textContent = 'Não foi possível copiar sozinho: o texto está selecionado, use Ctrl + C.';
  }
}

/**
 * Bônus: baixa o JSON como arquivo.
 * Blob = um "arquivo" criado na memória; o link <a download> faz o navegador salvá-lo.
 */
export function baixarExportacao(nomeArquivo) {
  const arquivo = new Blob([textoExportacao.value], { type: 'application/json' });
  const endereco = URL.createObjectURL(arquivo);
  const link = document.createElement('a');
  link.href = endereco;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(endereco); // libera a memória
  statusExportacao.textContent = `Arquivo ${nomeArquivo} baixado.`;
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

// =========================================================
// Aviso de feriado (US05)
// =========================================================

const statusFeriado = formulario.querySelector('[data-feriado-status]');
const confirmacaoFeriado = formulario.querySelector('[data-feriado-confirmacao]');
const campoConfirmaFeriado = formulario.querySelector('[name="confirmaFeriado"]');

/** Mensagem embaixo da data. tipo: 'carregando' | 'aviso' | 'erro' | 'neutro'. */
export function mostrarStatusFeriado(texto, tipo) {
  statusFeriado.textContent = texto;
  statusFeriado.classList.remove('campo__status--erro', 'campo__status--aviso');
  if (tipo === 'erro') statusFeriado.classList.add('campo__status--erro');
  if (tipo === 'aviso') statusFeriado.classList.add('campo__status--aviso');
}

/**
 * Mostra ou esconde o "Agendar mesmo assim".
 * Escondido = desabilitado e desmarcado (não vai no envio).
 */
export function pedirConfirmacaoFeriado(mostrar) {
  confirmacaoFeriado.hidden = !mostrar;
  campoConfirmaFeriado.disabled = !mostrar;
  campoConfirmaFeriado.checked = false;
}

// =========================================================
// Fechamento do dia (US07)
// =========================================================

const campoDiaFechamento = document.querySelector('[data-fechamento-dia]');
const fechamentoTotal = document.querySelector('[data-fechamento-total]');
const fechamentoFaturamento = document.querySelector('[data-fechamento-faturamento]');
const fechamentoPrevisto = document.querySelector('[data-fechamento-previsto]');
const fechamentoCancelados = document.querySelector('[data-fechamento-cancelados]');
const fechamentoProximo = document.querySelector('[data-fechamento-proximo]');
const fechamentoServicos = document.querySelector('[data-fechamento-servicos]');
const fechamentoServicosVazio = document.querySelector('[data-fechamento-servicos-vazio]');

/** Campo de data do fechamento (o app.js escuta a troca de dia). */
export function obterCampoDiaFechamento() {
  return campoDiaFechamento;
}

export function definirDiaFechamento(textoISO) {
  campoDiaFechamento.value = textoISO;
}

/**
 * Mostra o resultado de calcularFechamento() na tela.
 * @param {object} resumo – { totalAtendimentos, faturamento, previsto, cancelados, porServico, proximo, diaEncerrado }
 */
export function mostrarFechamento(resumo) {
  fechamentoTotal.textContent = resumo.totalAtendimentos;
  fechamentoFaturamento.textContent = formatarMoeda(resumo.faturamento);
  fechamentoPrevisto.textContent = formatarMoeda(resumo.previsto);
  fechamentoCancelados.textContent = resumo.cancelados;

  // Operador ternário encadeado: escolhe uma das três frases
  fechamentoProximo.textContent = resumo.proximo
    ? `Próximo atendimento: ${resumo.proximo.horario} – ${resumo.proximo.pet} (${resumo.proximo.nomeServico}), ${resumo.proximo.protocolo}.`
    : resumo.diaEncerrado
      ? 'Todos os atendimentos deste dia já foram finalizados.'
      : 'Nenhum próximo atendimento neste dia.';

  // Object.entries transforma { Banho: 2, Tosa: 1 } em [['Banho', 2], ['Tosa', 1]]
  const itens = Object.entries(resumo.porServico).map(([nome, quantidade]) => {
    const item = document.createElement('li');
    item.classList.add('fechamento__servico');
    item.textContent = `${nome}: ${quantidade}`;
    return item;
  });

  fechamentoServicos.replaceChildren(...itens);
  fechamentoServicosVazio.hidden = itens.length > 0;
}

// =========================================================
// Tema, filtro salvo e "Limpar meus dados" (US08)
// =========================================================

const botaoTema = document.querySelector('[data-botao-tema]');
const botaoLimparDados = document.querySelector('[data-limpar-dados]');
const statusDados = document.querySelector('[data-dados-status]');

export function obterControlesDados() {
  return { botaoTema, botaoLimparDados };
}

/**
 * Aplica o tema colocando data-tema="escuro" (ou "claro") na tag <html>.
 * O CSS troca as variáveis de cor em :root[data-tema="escuro"].
 */
export function aplicarTema(tema) {
  const escuro = tema === 'escuro';
  document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro';
  botaoTema.setAttribute('aria-pressed', String(escuro));
  botaoTema.textContent = escuro ? 'Tema claro' : 'Tema escuro';
}

/** Coloca o select de status no valor salvo. */
export function definirFiltroStatus(status) {
  campoFiltroStatus.value = status;
}

/** Botão "Limpar meus dados" no modo "clique de novo para confirmar". */
export function pedirConfirmacaoLimpeza(aguardando) {
  botaoLimparDados.textContent = aguardando ? 'Clique de novo para confirmar' : 'Limpar meus dados';
  statusDados.textContent = aguardando
    ? 'Isso apaga a agenda, o filtro e o tema salvos neste navegador.'
    : '';
}

export function mostrarStatusDados(texto) {
  statusDados.textContent = texto;
}

/** Esconde a caixa do JSON exportado (depois de limpar os dados ela ficaria desatualizada). */
export function esconderExportacao() {
  areaExportacao.hidden = true;
  textoExportacao.value = '';
}

// =========================================================
// Relógio, lembretes e aviso temporário (US09)
// =========================================================

const relogio = document.querySelector('[data-relogio]');
const textoLembrete = document.querySelector('[data-lembrete-texto]');
const botaoPausar = document.querySelector('[data-pausar-lembretes]');
const toast = document.querySelector('[data-toast]');

export function obterBotaoPausar() {
  return botaoPausar;
}

export function mostrarRelogio(horaTexto) {
  relogio.textContent = horaTexto;
  relogio.dateTime = horaTexto; // atributo datetime da tag <time>
}

export function mostrarTextoLembrete(texto) {
  textoLembrete.textContent = texto;
}

export function marcarLembretesPausados(pausado) {
  botaoPausar.textContent = pausado ? 'Retomar lembretes' : 'Pausar lembretes';
  botaoPausar.setAttribute('aria-pressed', String(pausado));
}

// Guarda o timer do toast. Se chegar um aviso novo antes do anterior sumir,
// o timer antigo é cancelado: assim os timers nunca se acumulam.
let timerToast = null;

/** Mostra um aviso no rodapé da tela que some sozinho (setTimeout). */
export function mostrarToast(texto, duracaoMs = 4000) {
  clearTimeout(timerToast);
  toast.textContent = texto;
  toast.hidden = false;
  timerToast = setTimeout(() => {
    toast.hidden = true;
    timerToast = null;
  }, duracaoMs);
}
