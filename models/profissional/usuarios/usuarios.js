const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  tipo: { 
    type: String, 
    enum: ['cliente', 'profissional'], 
    required: true 
  },
  nome: { type: String, required: true },
  sobrenome: { type: String, required: true },
  cpf: { type: String, required: true, unique: true },
  datanasc: { type: Date, required: true }, 
  telefone: { type: String, required: true },
  genero: { type: String, enum: ['masculino', 'feminino', 'outro'], required: true },
  email: { type: String, required: true, unique: true },
  rua: { type: String, required: true },
  numero: { type: String, required: true },
  complemento: { type: String },
  bairro: { type: String, required: true },
  cidade: { type: String, required: true },
  estado: { type: String, required: true },
  cep: { type: String, required: true },
  senha: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);
