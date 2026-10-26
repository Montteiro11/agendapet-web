// =========================================================
// storage.js – único arquivo que mexe no localStorage.
//
// Por que centralizar? Se um dia trocarmos o jeito de salvar,
// só este arquivo muda. E todas as chaves ganham o prefixo
// "agendapet:", para não misturar com dados de outros sites
// e para o "Limpar meus dados" (US08) apagar só as nossas.
// Chaves usadas: agendapet:agenda, agendapet:filtro, agendapet:tema e agendapet:feriados:{ano}.
// =========================================================

const PREFIXO = 'agendapet:';

/**
 * Lê um valor salvo e converte de texto JSON para objeto.
 * Se não existir, devolve o valor padrão.
 * try/catch: se o texto estiver corrompido (JSON inválido) ou o
 * navegador bloquear o localStorage, a página continua funcionando.
 */
export function lerJSON(chave, padrao = null) {
  try {
    const texto = localStorage.getItem(PREFIXO + chave);
    return texto === null ? padrao : JSON.parse(texto);
  } catch (erro) {
    console.warn(`[AgendaPet] Não foi possível ler "${chave}":`, erro.message);
    return padrao;
  }
}

/**
 * Salva um valor convertendo para texto JSON.
 * Devolve true se deu certo e false se não foi possível salvar.
 */
export function salvarJSON(chave, valor) {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    return true;
  } catch (erro) {
    console.warn(`[AgendaPet] Não foi possível salvar "${chave}":`, erro.message);
    return false;
  }
}

// ---------------------------------------------------------
// Persistência da agenda (US08)
// ---------------------------------------------------------

/** Nomes das chaves (o prefixo "agendapet:" entra sozinho). */
export const CHAVES = {
  AGENDA: 'agenda',
  FILTRO: 'filtro',
  TEMA: 'tema',
};

/**
 * "Limpar meus dados": apaga SÓ as chaves que começam com "agendapet:".
 * Dados de outros sites ou sistemas no mesmo navegador não são tocados.
 * Devolve quantas chaves foram apagadas.
 */
export function removerDadosDoApp() {
  try {
    // Primeiro anota as chaves e só depois apaga:
    // apagar durante o laço mudaria as posições (localStorage.key(i)).
    const chavesDoApp = [];
    for (let i = 0; i < localStorage.length; i++) {
      const chave = localStorage.key(i);
      if (chave && chave.startsWith(PREFIXO)) {
        chavesDoApp.push(chave);
      }
    }
    chavesDoApp.forEach((chave) => localStorage.removeItem(chave));
    return chavesDoApp.length;
  } catch (erro) {
    console.warn('[AgendaPet] Não foi possível limpar os dados:', erro.message);
    return 0;
  }
}
