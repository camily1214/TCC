const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Esquema do Evento
const eventoSchema = new mongoose.Schema({
  acesso: { type: String, required: true },
  tipo_evento: { type: String, required: true },
  tipo_bebida: { type: String, required: true },
  data_evento: { type: String, required: true },
  horario_evento: { type: String, required: true },
  tipo_comida: { type: String, required: true },
  numero_convidados: { type: Number, required: true },
  rua: { type: String, required: true },
  numero: { type: String, required: true },
  bairro: { type: String, required: true },
  cidade: { type: String, required: true },
  estado: { type: String, required: true },
  cep: { type: String, required: true },
});

const Evento = mongoose.model('Evento', eventoSchema);

// Rota POST para cadastrar evento
router.post('/api/eventos', async (req, res) => {
  try {
    const novoEvento = new Evento(req.body);
    await novoEvento.save();
    res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!' });
  } catch (erro) {
    res.status(400).json({ erro: 'Erro ao cadastrar evento. Verifique os dados.' });
  }
});

module.exports = router;
