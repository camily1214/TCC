const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  acesso: String,
  tipo_evento: String,
  tipo_bebida: String,
  tipo_comida: String,
  num_convidados: String,
  data_evento: String,
  hora_evento: String,
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
  }
});

module.exports = mongoose.model('Evento', EventSchema);
