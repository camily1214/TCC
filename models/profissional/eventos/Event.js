const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  acesso: String,
  tipo_evento: String,
  tipo_bebida: String,
  tipo_comida: String,
  num_convidados: {
    type: Number,
    required: true
  },
  data_evento: {
    type: Date,
    required: true
  },
  hora_evento: {
    type: String,
    required: true
  },
  hora_fim_evento: {
    type: String,
    required: true
  },
  descricao_evento: {
    type: String,
    default: ''
  },
  rua: String,
  numero: String,
  complemento: String,
  bairro: String,
  cidade: String,
  estado: String,
  cep: String,

  // 🔹 Campos de controle
  status: {
    type: String,
    enum: ['aguardando', 'confirmado', 'cancelado'],
    default: 'aguardando'
  },
  motivo_cancelamento: {
    type: String,
    default: null // armazena o motivo informado pelo profissional
  },
  dataAlteracaoStatus: {
    type: Date,
    default: null
  },

  // 🔹 Relação com o usuário (cliente)
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
});

module.exports = mongoose.model('Evento', EventSchema);
