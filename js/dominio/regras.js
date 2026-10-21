// =========================================================
// dominio/regras.js – regras de validação do agendamento.
//
// REGRA DA PASTA dominio/: aqui NÃO pode ter document, window,
// localStorage nem fetch. Só lógica pura (recebe dados, devolve resultado).
// Por isso este arquivo vai funcionar também no Node (US11).
// =========================================================

// Horário de funcionamento da Patinhas & Cia (registrado no README).
// A loja fecha às 18:00, então o último atendimento começa às 17:30.
export const HORARIO_ABERTURA = '08:00';
export const HORARIO_ULTIMO_INICIO = '17:30';

/** Remove tudo que não é número: "(48) 99999-1234" -> "48999991234" */
export function apenasDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

/** Telefone válido = DDD + número: 10 dígitos (fixo) ou 11 (celular). */
export function telefoneValido(telefone) {
  const digitos = apenasDigitos(telefone);
  return digitos.length === 10 || digitos.length === 11;
}

/**
 * Converte um objeto Date para o texto "AAAA-MM-DD" no horário LOCAL.
 * (toISOString() usaria o fuso UTC e, à noite, poderia virar o dia seguinte.)
 */
export function dataParaISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0'); // getMonth começa em 0
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Converte um Date para "HH:MM" (horário local). */
export function horaParaTexto(data) {
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

// Mensagens para os campos obrigatórios (objeto usado como "dicionário")
const MENSAGENS_OBRIGATORIAS = {
  tutor: 'Informe o nome do tutor.',
  telefone: 'Informe um telefone para contato.',
  pet: 'Informe o nome do pet.',
  especie: 'Escolha a espécie do pet.',
  servico: 'Escolha um serviço.',
  data: 'Escolha a data do atendimento.',
  horario: 'Escolha o horário do atendimento.',
};

/**
 * Valida os dados do formulário.
 *
 * @param {object} dados     – valores digitados (tutor, telefone, pet, ...)
 * @param {object} contexto  – informações de fora: { agora } (data/hora atual)
 * @returns {object} erros   – { nomeDoCampo: 'mensagem' }. Objeto vazio = tudo certo.
 *
 * Por que receber "agora" de fora? Para poder testar com qualquer data
 * (ex.: fingir que hoje é 25/12) sem mexer no relógio do computador.
 */
export function validarAgendamento(dados, contexto = {}) {
  const agora = contexto.agora ?? new Date(); // ?? = "se for null/undefined, use o da direita"
  const erros = {};

  // 1. Campos obrigatórios: laço for...of percorre cada par [campo, mensagem]
  for (const [campo, mensagem] of Object.entries(MENSAGENS_OBRIGATORIAS)) {
    if (!dados[campo]) {
      erros[campo] = mensagem;
    }
  }

  // 2. Telefone (só confere o formato se algo foi digitado)
  if (dados.telefone && !telefoneValido(dados.telefone)) {
    erros.telefone = 'Telefone inválido: use DDD + número, com 10 ou 11 dígitos.';
  }

  // 3. Data não pode estar no passado.
  //    Textos "AAAA-MM-DD" podem ser comparados direto com < e >,
  //    porque a ordem alfabética é igual à ordem das datas.
  const hoje = dataParaISO(agora);
  if (dados.data && dados.data < hoje) {
    erros.data = 'A data não pode estar no passado.';
  }

  // 4. Horário dentro do funcionamento (mesma ideia: "HH:MM" compara como texto)
  if (dados.horario) {
    if (dados.horario < HORARIO_ABERTURA || dados.horario > HORARIO_ULTIMO_INICIO) {
      erros.horario = `Fora do horário de funcionamento: escolha entre ${HORARIO_ABERTURA} e ${HORARIO_ULTIMO_INICIO}.`;
    } else if (dados.data === hoje && dados.horario <= horaParaTexto(agora)) {
      erros.horario = 'Esse horário de hoje já passou. Escolha um horário mais tarde.';
    }
  }

  return erros;
}
