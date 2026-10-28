// =========================================================
// scripts/validar-agenda.cjs – valida um arquivo de agenda (US11).
//
// Módulo CommonJS: usa require() e module.exports.
// A extensão .cjs avisa o Node que este arquivo é CommonJS,
// mesmo com "type": "module" no package.json.
//
// Como rodar:
//   npm run validar                                  -> valida data/agenda-exemplo.json
//   npm run validar -- data/agenda-invalida.json     -> valida outro arquivo
//
// Termina com process.exit(1) se encontrar qualquer erro.
// =========================================================

const fs = require('fs');
const path = require('path');

const CAMPOS_OBRIGATORIOS = [
  'protocolo', 'tutor', 'telefone', 'pet', 'especie',
  'servicoId', 'nomeServico', 'preco', 'data', 'horario', 'status',
];
const CAMPOS_ENDERECO = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'];
const STATUS_VALIDOS = ['Agendado', 'Concluído', 'Cancelado'];

/** "2026-02-30" não existe: o Date "pula" para março, então a data volta diferente. */
function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

/** "HH:MM" entre 00:00 e 23:59 */
function horarioValido(texto) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(texto);
}

/**
 * Valida a lista e devolve um array de mensagens de erro (vazio = tudo certo).
 */
function validarAgenda(lista) {
  const erros = [];

  if (!Array.isArray(lista)) {
    return ['O arquivo precisa conter uma lista (array) de agendamentos.'];
  }

  const protocolosVistos = new Set();
  const horariosOcupados = new Map(); // "2026-10-30 08:00" -> "AP-0001"

  lista.forEach((item, indice) => {
    const ref = `Item ${indice + 1} (${item && item.protocolo ? item.protocolo : 'sem protocolo'})`;

    if (item === null || typeof item !== 'object') {
      erros.push(`${ref}: não é um objeto.`);
      return;
    }

    // 1. Campos obrigatórios
    for (const campo of CAMPOS_OBRIGATORIOS) {
      if (item[campo] === undefined || item[campo] === null || item[campo] === '') {
        erros.push(`${ref}: falta o campo "${campo}".`);
      }
    }

    // 2. Formatos
    if (item.protocolo && !/^AP-\d{4}$/.test(item.protocolo)) {
      erros.push(`${ref}: protocolo fora do formato AP-0000.`);
    }
    if (item.data && !dataValida(item.data)) {
      erros.push(`${ref}: data inválida "${item.data}".`);
    }
    if (item.horario && !horarioValido(item.horario)) {
      erros.push(`${ref}: horário inválido "${item.horario}".`);
    }
    if (item.status && !STATUS_VALIDOS.includes(item.status)) {
      erros.push(`${ref}: status "${item.status}" não existe (use ${STATUS_VALIDOS.join(', ')}).`);
    }
    if (item.preco !== undefined && (typeof item.preco !== 'number' || item.preco < 0)) {
      erros.push(`${ref}: preço inválido "${item.preco}".`);
    }

    // 3. Atendimento a domicílio precisa de endereço completo
    if (item.tipo === 'domiciliar') {
      const endereco = item.endereco || {};
      const faltando = CAMPOS_ENDERECO.filter((campo) => !endereco[campo]);
      if (faltando.length > 0) {
        erros.push(`${ref}: atendimento a domicílio sem ${faltando.join(', ')} no endereço.`);
      }
    }

    // 4. Protocolo repetido
    if (item.protocolo) {
      if (protocolosVistos.has(item.protocolo)) {
        erros.push(`${ref}: protocolo repetido.`);
      }
      protocolosVistos.add(item.protocolo);
    }

    // 5. Conflito: dois agendamentos ATIVOS (não cancelados) no mesmo dia e horário
    if (item.status !== 'Cancelado' && dataValida(item.data) && horarioValido(item.horario)) {
      const chave = `${item.data} ${item.horario}`;
      if (horariosOcupados.has(chave)) {
        erros.push(`${ref}: conflito de horário com ${horariosOcupados.get(chave)} em ${chave}.`);
      } else {
        horariosOcupados.set(chave, item.protocolo);
      }
    }
  });

  return erros;
}

// module.exports: o jeito CommonJS de "exportar" (equivale ao export do ESM)
module.exports = { validarAgenda, dataValida, horarioValido };

// require.main === module: só roda o bloco abaixo quando o arquivo é executado
// direto pelo terminal (e não quando outro arquivo faz require dele)
if (require.main === module) {
  // path.resolve monta o caminho completo; __dirname = pasta deste arquivo
  const arquivo = path.resolve(
    process.argv[2] || path.join(__dirname, '..', 'data', 'agenda-exemplo.json')
  );
  const nome = path.relative(process.cwd(), arquivo);

  let lista;
  try {
    lista = JSON.parse(fs.readFileSync(arquivo, 'utf-8'));
  } catch (erro) {
    console.error(`✖ Não foi possível ler "${nome}": ${erro.message}`);
    process.exit(1);
  }

  const erros = validarAgenda(lista);

  if (erros.length > 0) {
    console.error(`✖ ${nome}: ${erros.length} erro(s) encontrado(s):`);
    erros.forEach((erro) => console.error(`  - ${erro}`));
    process.exit(1); // avisa o terminal (e o npm) que a validação falhou
  }

  console.log(`✔ ${nome}: ${lista.length} agendamentos válidos, sem conflitos de horário.`);
}
