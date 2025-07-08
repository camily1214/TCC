const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nome: String,
  sobrenome: String,
  cpf: String,
  datanasc: String,
  telefone: String,
  genero: String,
  email: String,
  rua: String,
  numero: String,
  complemento: String,
  bairro: String,
  cidade: String,
  estado: String,
  cep: String,
  senha: String,
  confirmasenha: String
});

module.exports = mongoose.model('Usuario', usuarioSchema);
