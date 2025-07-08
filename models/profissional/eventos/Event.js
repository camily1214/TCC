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

  // novo campo para controle de confirmação
  confirmado: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Evento', EventSchema);
