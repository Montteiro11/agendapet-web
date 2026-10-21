// =========================================================
// api.js – tudo que "conversa" com um servidor usando fetch.
// Hoje: o catálogo de serviços (servidor local).
// Depois: ViaCEP (US04) e BrasilAPI (US05).
// =========================================================

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
