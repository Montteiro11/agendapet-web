// =========================================================
// api.js – tudo que "conversa" com um servidor usando fetch.
// - catálogo de serviços (servidor local, US02)
// - endereço pelo CEP (ViaCEP, US04)
// - feriados nacionais (BrasilAPI, US05), com cache no localStorage
// =========================================================

import { lerJSON, salvarJSON } from './storage.js';

const CAMINHO_SERVICOS = './data/servicos.json';

/**
 * Busca a lista de serviços no arquivo data/servicos.json.
 *
 * async  -> a função devolve uma Promise (um "vale" de um resultado que chega depois).
 * await  -> espera a Promise terminar antes de ir para a próxima linha,
 *           sem travar a página.
 *
 * Se algo der errado, a função LANÇA um erro (throw).
 * Quem chamou decide o que mostrar na tela (isso fica no app.js).
 */
export async function buscarServicos() {
  // 1. Pede o arquivo ao servidor local (npm start)
  const resposta = await fetch(CAMINHO_SERVICOS);

  // 2. fetch só falha sozinho se a rede cair.
  //    Um 404 (arquivo não encontrado) NÃO cai no catch,
  //    por isso conferimos resposta.ok manualmente.
  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar os serviços (HTTP ${resposta.status}).`);
  }

  // 3. Converte o texto JSON em array de objetos JavaScript
  const servicos = await resposta.json();
  return servicos;
}

// ---------------------------------------------------------
// ViaCEP (US04) – API pública na internet
// ---------------------------------------------------------

/**
 * Cria um erro com um "tipo", para quem chamou saber
 * qual mensagem mostrar (cada caso tem uma mensagem diferente).
 */
function criarErro(tipo, mensagem) {
  const erro = new Error(mensagem);
  erro.tipo = tipo;
  return erro;
}

/**
 * Busca o endereço de um CEP (8 números, sem hífen).
 * Três falhas possíveis, cada uma com seu tipo:
 *  - 'rede'           -> sem internet ou ViaCEP fora do ar (o fetch nem recebe resposta)
 *  - 'invalido'       -> o ViaCEP respondeu com erro HTTP (ex.: 400, formato recusado)
 *  - 'nao-encontrado' -> o CEP tem formato certo, mas não existe ("erro": true)
 */
export async function buscarEndereco(cep) {
  let resposta;

  try {
    resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  } catch {
    // Aqui o fetch FALHOU de verdade: não houve resposta nenhuma.
    throw criarErro('rede', 'Sem conexão com o serviço de CEP. Preencha o endereço manualmente.');
  }

  if (!resposta.ok) {
    throw criarErro('invalido', 'O serviço de CEP recusou esse número. Confira os 8 dígitos.');
  }

  const dados = await resposta.json();

  // O ViaCEP responde 200 mesmo quando o CEP não existe, mas manda { "erro": true }
  if (dados.erro) {
    throw criarErro('nao-encontrado', 'CEP não encontrado. Confira o número ou preencha o endereço manualmente.');
  }

  // Devolvemos só o que interessa, já com os nomes que usamos no formulário
  return {
    logradouro: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    uf: dados.uf,
  };
}

// ---------------------------------------------------------
// BrasilAPI – feriados (US05)
// ---------------------------------------------------------

// Validade do cache: 30 dias em milissegundos (Date.now() trabalha em ms)
const VALIDADE_FERIADOS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Devolve a lista de feriados nacionais do ano.
 * Formato de cada item: { date: "2026-12-25", name: "Natal", type: "national" }
 *
 * 1. Procura no localStorage (chave "agendapet:feriados:2026").
 * 2. Se existir e tiver menos de 30 dias, usa o cache: NENHUMA requisição.
 * 3. Senão, busca na BrasilAPI e guarda a lista com a data da consulta.
 *
 * Se a API falhar, a função lança o erro; quem chamou decide o aviso.
 */
export async function buscarFeriados(ano) {
  const chave = `feriados:${ano}`;
  const cache = lerJSON(chave);

  // ?. evita erro se cache for null. Array.isArray confere que é mesmo uma lista.
  const cacheValido =
    Array.isArray(cache?.feriados) && Date.now() - cache.consultadoEm < VALIDADE_FERIADOS_MS;

  if (cacheValido) {
    return cache.feriados;
  }

  const resposta = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
  if (!resposta.ok) {
    throw new Error(`BrasilAPI respondeu HTTP ${resposta.status}.`);
  }

  const feriados = await resposta.json();
  salvarJSON(chave, { consultadoEm: Date.now(), feriados });
  return feriados;
}
