const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  acesso: String,
  tipo_evento: String,
  tipo_bebida: String,
  tipo_comida: String,
  num_convidados: {
    type: Number, // número deve ser numérico, não string
    required: true
  },
  data_evento: {
    type: Date, // data em formato Date para funcionar bem com filtros e ordenações
    required: true
  },
  hora_evento: {
    type: String,
    required: true
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

  // 👇 Campos adicionados para registrar quem e quando alterou o status
  alteradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  dataAlteracaoStatus: {
    type: Date
  }
});

module.exports = mongoose.model('Evento', EventSchema);
