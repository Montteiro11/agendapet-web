// =========================================================
// app.js – ponto de entrada do navegador.
// Ele não desenha nada sozinho: chama a api.js para buscar dados
// e a ui.js para mostrar na tela.
// =========================================================

import { buscarServicos } from './api.js';
import {
  mostrarCatalogoCarregando,
  mostrarCatalogoErro,
  mostrarCatalogo,
} from './ui.js';

// Guardamos os serviços aqui porque a US03 vai usar
// a mesma lista no campo <select> do formulário.
let servicos = [];

/**
 * Carrega o catálogo tratando os três estados exigidos na US02:
 * carregando -> sucesso  OU  carregando -> erro (com "Tentar novamente").
 */
async function carregarCatalogo() {
  mostrarCatalogoCarregando();

  try {
    servicos = await buscarServicos();
    mostrarCatalogo(servicos);
  } catch (erro) {
    // console.warn (amarelo) em vez de deixar o erro "estourar" vermelho no console
    console.warn('[AgendaPet] Falha ao carregar o catálogo:', erro.message);
    // Passamos a própria função carregarCatalogo como callback do botão
    mostrarCatalogoErro('Não conseguimos carregar os serviços.', carregarCatalogo);
  }
}

carregarCatalogo();
