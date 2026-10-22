// =========================================================
// dominio/agendamento.js – configuração, classes e protocolo.
//
// Pasta dominio/: sem document, window, localStorage nem fetch.
// Estas classes funcionam igual no navegador e no Node (US11).
// =========================================================

// ---------------------------------------------------------
// Configuração (regras de preço registradas no README)
// ---------------------------------------------------------

/** Taxa fixa de deslocamento para atendimento a domicílio, em reais. */
export const TAXA_DESLOCAMENTO = 20;

/** Os três status possíveis de um agendamento. */
export const STATUS = {
  AGENDADO: 'Agendado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

// ---------------------------------------------------------
// Protocolo sequencial com CLOSURE
// ---------------------------------------------------------

/**
 * Cria uma função que gera protocolos AP-0001, AP-0002, AP-0003...
 *
 * CLOSURE: a variável "contador" nasce aqui dentro, mas a função
 * devolvida continua "lembrando" dela mesmo depois que
 * criarGeradorDeProtocolo terminou. Ninguém de fora consegue
 * mexer no contador: não existe variável global.
 *
 * @param {number} ultimoNumero – último número já usado (0 = começar do AP-0001)
 */
export function criarGeradorDeProtocolo(ultimoNumero = 0) {
  let contador = ultimoNumero;

  return function gerarProtocolo() {
    contador += 1;
    // padStart(4, '0'): completa com zeros à esquerda -> 7 vira "0007"
    return `AP-${String(contador).padStart(4, '0')}`;
  };
}

/** "AP-0042" -> 42. Útil para continuar a numeração de uma agenda salva. */
export function numeroDoProtocolo(protocolo) {
  const numero = Number(String(protocolo).replace('AP-', ''));
  return Number.isInteger(numero) ? numero : 0;
}

// ---------------------------------------------------------
// Classe base: Agendamento
// ---------------------------------------------------------

export class Agendamento {
  /**
   * O constructor roda uma vez, quando fazemos "new Agendamento({...})".
   * "this" é o objeto que está sendo criado: cada agendamento tem os seus valores.
   */
  constructor({ protocolo, tutor, telefone, pet, especie, servicoId, nomeServico, preco, data, horario, observacoes = '', status = STATUS.AGENDADO }) {
    this.protocolo = protocolo;
    this.tutor = tutor;
    this.telefone = telefone;
    this.pet = pet;
    this.especie = especie;
    this.servicoId = servicoId;
    this.nomeServico = nomeServico;
    this.preco = Number(preco);
    this.data = data;       // "AAAA-MM-DD"
    this.horario = horario; // "HH:MM"
    this.observacoes = observacoes;
    this.status = status;
  }

  /** Valor cobrado. Na loja, é só o preço do serviço. */
  calcularValor() {
    return this.preco;
  }

  /** Texto curto para listas e relatórios. */
  resumo() {
    return `${this.pet} (${this.nomeServico}) · tutor: ${this.tutor}`;
  }

  /** Ativo = ainda conta na agenda (Agendado ou Concluído). Cancelado libera o horário. */
  estaAtivo() {
    return this.status !== STATUS.CANCELADO;
  }

  /** Mesmo dia e mesmo horário de outro agendamento? */
  mesmoHorarioQue(outro) {
    return this.data === outro.data && this.horario === outro.horario;
  }

  /**
   * Marca como concluído. "this" aqui é o agendamento em que o método foi chamado:
   * rex.concluir() muda o status do Rex, e não de outro pet.
   */
  concluir() {
    if (this.status !== STATUS.AGENDADO) {
      throw new Error(`${this.protocolo} já está ${this.status.toLowerCase()}.`);
    }
    this.status = STATUS.CONCLUIDO;
  }

  cancelar() {
    if (this.status !== STATUS.AGENDADO) {
      throw new Error(`${this.protocolo} já está ${this.status.toLowerCase()}.`);
    }
    this.status = STATUS.CANCELADO;
  }

  /**
   * JSON.stringify chama este método sozinho.
   * Define o formato salvo no localStorage (US08) e lido pelos scripts de Node (US11).
   */
  toJSON() {
    return {
      tipo: 'loja',
      protocolo: this.protocolo,
      tutor: this.tutor,
      telefone: this.telefone,
      pet: this.pet,
      especie: this.especie,
      servicoId: this.servicoId,
      nomeServico: this.nomeServico,
      preco: this.preco,
      data: this.data,
      horario: this.horario,
      observacoes: this.observacoes,
      status: this.status,
    };
  }
}

// ---------------------------------------------------------
// Subclasse: AgendamentoDomiciliar (HERANÇA)
// ---------------------------------------------------------

/**
 * "extends" = herda tudo do Agendamento (atributos e métodos).
 * Ela ACRESCENTA o endereço e SOBRESCREVE calcularValor, resumo e toJSON.
 */
export class AgendamentoDomiciliar extends Agendamento {
  constructor(dados) {
    // super(...) chama o constructor da classe mãe. Tem que vir antes de usar "this".
    super(dados);
    this.endereco = { ...dados.endereco }; // cópia do objeto endereço
  }

  /** Sobrescrito: preço do serviço + taxa de deslocamento. */
  calcularValor() {
    // super.calcularValor() reaproveita a regra da classe mãe
    return super.calcularValor() + TAXA_DESLOCAMENTO;
  }

  /** Sobrescrito: o resumo também mostra o endereço. */
  resumo() {
    const { logradouro, numero, bairro, cidade, uf } = this.endereco; // desestruturação
    return `${super.resumo()} · a domicílio: ${logradouro}, ${numero} – ${bairro}, ${cidade}/${uf}`;
  }

  toJSON() {
    return { ...super.toJSON(), tipo: 'domiciliar', endereco: { ...this.endereco } };
  }
}

// ---------------------------------------------------------
// Fábrica: escolhe a classe certa
// ---------------------------------------------------------

/**
 * Recebe um objeto simples (do formulário ou de um JSON salvo)
 * e devolve uma instância de Agendamento ou de AgendamentoDomiciliar.
 */
export function criarAgendamento(dados) {
  if (dados.tipo === 'domiciliar' || dados.endereco) {
    return new AgendamentoDomiciliar(dados);
  }
  return new Agendamento(dados);
}
