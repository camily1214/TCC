const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Conectando ao MongoDB
mongoose.connect(mongoURI)

// Esquema do Evento
const eventoSchema = new mongoose.Schema({
  acesso: String,
  tipo_evento: String,
  tipo_bebida: String,
  data_evento: String,
  horario_evento: String,
  tipo_comida: String,
  numero_convidados: Number,
  rua: String,
  numero: String,
  bairro: String,
  cidade: String,
  estado: String,
  cep: String,
});

const Evento = mongoose.model('Evento', eventoSchema);

// Middlewares
app.use(cors());
app.use(express.json());

// Rota para cadastro de evento
app.post('/api/eventos', async (req, res) => {
  try {
    const novoEvento = new Evento(req.body);
    await novoEvento.save();
    res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao cadastrar evento.' });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${3000}`);
});
