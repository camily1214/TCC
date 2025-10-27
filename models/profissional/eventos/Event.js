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

  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  status: {
    type: String,
    enum: ['aguardando', 'confirmado', 'cancelado'],
    default: 'aguardando'
  },

  // Campos adicionados para registrar quem e quando alterou o status
  alteradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  dataAlteracaoStatus: {
    type: Date
  }
});

module.exports = mongoose.model('Evento', EventSchema);
