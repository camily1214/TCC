const express = require('express');
const router = express.Router();
const path = require('path');
const Evento = require('../models/profissional/eventos/Event');
const Usuario = require('../models/profissional/usuarios/usuarios');
const { autenticar, apenasClientes, apenasProfissionais } = require('../middlewares/auth');


// CLIENTE → Ver seus próprios eventos
router.get('/meus-eventos', autenticar, apenasClientes, async (req, res) => {
  try {
    const eventos = await Evento.find({ clienteId: req.session.usuarioId });
    res.json(eventos);
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao buscar eventos do cliente.' });
  }
});

// PROFISSIONAL → Ver eventos com nome e telefone do cliente
router.get('/lista-evento', autenticar, apenasProfissionais, async (req, res) => {
  try {
    // O campo correto é clienteId? Aqui usa clienteId para popular
    const eventos = await Evento.find().populate('clienteId', 'nome telefone');
    res.json(eventos);
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao buscar eventos para profissional.' });
  }
});

// Página para escolher data
router.get('/escolher-data', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EscolherData.html'));
});

// Página de criação de evento
router.get('/criar', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/CriarEvent.html'));
});

// CLIENTE: Página de criação de evento (nova rota)
router.get('/criar-cliente', autenticar, apenasClientes, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/clientes/eventos/CriarEventCliente.html'));
});

// PROFISSIONAL: Página de criação de evento (nova rota)
router.get('/criar-profissional', autenticar, apenasProfissionais, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/CriarEvent.html'));
});

// Página de sucesso após cadastrar evento
router.get('/sucesso', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EventSucesso.html'));
});

// Página de edição de evento
router.get('/editar', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EditarEvent.html'));
});

// CANCELAR ALTERAÇÕES (voltar sem salvar) — deve vir ANTES do /:id
router.get('/editar/cancelar', (req, res) => {
  res.redirect('/api/eventos-profissional/lista-evento');
});


// Salvar evento via POST com cliente autenticado
router.post('/novo-evento', autenticar, apenasClientes, async (req, res) => {
    console.log('Sessão:', req.session);
  try {
    const clienteId = req.session.usuarioId;

    if (!clienteId) {
      return res.status(401).json({ erro: 'Usuário não autenticado.' });
    }

    const {
      acesso, tipo_evento, tipo_comida, tipo_bebida,
      numero_convidados, data_evento, horario_evento,
      rua, numero, complemento, bairro, cidade, estado, cep
    } = req.body;

    // Validação simples (use bibliotecas como Joi para validações robustas)
    if (!acesso || !tipo_evento || !tipo_comida || !tipo_bebida ||
        !numero_convidados || !data_evento || !horario_evento ||
        !rua || !numero || !bairro || !cidade || !estado || !cep) {
      return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios.' });
    }

    const novoEvento = new Evento({
      clienteId,
      acesso,
      tipo_evento,
      tipo_comida,
      tipo_bebida,
      numero_convidados,
      data_evento,
      horario_evento,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      usuarioId: clienteId  // Evitar duplicidade: se clienteId e usuarioId são a mesma coisa, pode eliminar um
    });

    await novoEvento.save();
    res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!' });

  } catch (erro) {
    console.error('Erro ao cadastrar evento:', erro);
    res.status(500).json({ erro: 'Erro ao cadastrar evento. Verifique os dados.' });
  }
});


// Criar novo evento vinculando ao cliente informado no corpo da requisição
router.post('/criar-com-cliente', async (req, res) => {
  try {
    const {
      clienteId, acesso, tipo_evento, tipo_comida, tipo_bebida,
      numero_convidados, data_evento, horario_evento,
      rua, numero, complemento, bairro, cidade, estado, cep
    } = req.body;

    if (!clienteId) {
      return res.status(400).json({ erro: 'clienteId é obrigatório.' });
    }

    const cliente = await Usuario.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }

    // Validação dos demais campos
    if (!acesso || !tipo_evento || !tipo_comida || !tipo_bebida ||
        !numero_convidados || !data_evento || !horario_evento ||
        !rua || !numero || !bairro || !cidade || !estado || !cep) {
      return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios.' });
    }

    const novoEvento = new Evento({
      acesso,
      tipo_evento,
      tipo_comida,
      tipo_bebida,
      numero_convidados,
      data_evento,
      horario_evento,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      clienteId,
      usuarioId: clienteId  // Mesmo comentário do duplicado
    });

    await novoEvento.save();
    res.status(201).json({ mensagem: 'Evento cadastrado com sucesso!' });
  } catch (erro) {
    console.error('Erro ao cadastrar evento:', erro);
    res.status(400).json({ erro: 'Erro ao cadastrar evento.' });
  }
});


// Rota para listar todos os eventos (sem filtros)
router.get('/listar', async (req, res) => {
  try {
    const eventos = await Evento.find();
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar eventos' });
  }
});

// Listar todos os eventos com dados do cliente (nome e telefone)
router.get('/todos', async (req, res) => {
  try {
    const eventos = await Evento.find().populate('clienteId', 'nome telefone');
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar eventos.' });
  }
});

// Página de detalhes do evento
router.get('/detalhes', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/DetalhesEvento.html'));
});



// Rota para retornar somente as datas dos eventos agendados
router.get('/datas-agendadas', async (req, res) => {
  try {
    const eventos = await Evento.find({}, 'data_evento').lean();
    const datas = eventos.map(e => {
      const d = new Date(e.data_evento);
      const ano = d.getFullYear();
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const dia = String(d.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    });
    const datasUnicas = [...new Set(datas)];
    res.json(datasUnicas);
  } catch (err) {
    console.error('Erro ao buscar datas:', err);
    res.status(500).json({ error: 'Erro ao buscar datas' });
  }
});

// Rota: Ver todos os eventos com dados do cliente (nome e telefone)
router.get('/todos-com-clientes', async (req, res) => {
  try {
    const eventos = await Evento.find()
      .populate('clienteId', 'nome telefone'); // corrigido para clienteId

    res.json(eventos);
  } catch (err) {
    console.error('Erro ao buscar eventos com clientes:', err);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

// API: Buscar evento por ID — deve vir por último para evitar conflito com outras rotas
router.get('/:id', async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).send('Evento não encontrado');
    res.json(evento);
  } catch (err) {
    res.status(500).send('Erro ao buscar evento');
  }
});

// API: Deletar evento
router.delete('/:id', async (req, res) => {
  try {
    await Evento.findByIdAndDelete(req.params.id);
    res.status(200).send('Evento excluído');
  } catch (err) {
    res.status(500).send('Erro ao excluir evento');
  }
});

// Atualizar evento
router.put('/:id', async (req, res) => {
  try {
    const eventoAtualizado = await Evento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(eventoAtualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar evento.' });
  }
});

// Confirmar evento
router.put('/:id/confirmar', async (req, res) => {
  try {
    const evento = await Evento.findByIdAndUpdate(
      req.params.id,
      { confirmado: true },
      { new: true }
    );
    if (!evento) return res.status(404).send('Evento não encontrado');
    res.json(evento);
  } catch (err) {
    res.status(500).send('Erro ao confirmar evento');
  }
});

module.exports = router;
