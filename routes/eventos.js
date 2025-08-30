const express = require('express');
const router = express.Router();
const path = require('path');
const Evento = require('../models/profissional/eventos/Event');

// ✅ Importar middleware de autenticação
const autenticar = require('../middlewares/autenticar');

// Rota para abrir a página HTML de lista de eventos
router.get('/lista-eventos-html', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/ListaEvent.html'));
});


// Página para escolher data (não precisa login)
router.get('/escolher-data', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EscolherData.html'));
});

// Página de criação de evento (precisa estar logado)
router.get('/criar', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/CriarEvent.html'));
});

// ✅ NOVO: Página de sucesso após cadastrar evento
router.get('/sucesso', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EventSucesso.html'));
});

// Página de edição de evento
router.get('/editar', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EditarEvent.html'));
});

// ✅ CANCELAR ALTERAÇÕES (voltar sem salvar) — deve vir ANTES do /:id
router.get('/editar/cancelar', autenticar, (req, res) => {
  res.redirect('/api/eventos/lista-evento');
});

// Página de pós-login (cliente)
router.get('/pos-login', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/PosLogin.html'));
});

// Página para listar usuarios (provavelmente só profissionais)
router.get('/ListaUsu', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/usuarios/ListaUsu.html'));
});

router.get('/meus-eventos', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/meus-eventos.html'));
});


// Salvar evento via POST
router.post('/novo-evento', autenticar, async (req, res) => {
  try {
    const {
      acesso, tipo_evento, tipo_comida, tipo_bebida,
      num_convidados, data_evento, hora_evento,
      rua, numero, complemento, bairro, cidade, estado, cep,
    } = req.body;

    // separa ano, mês, dia
    const [ano, mes, dia] = data_evento.split('-').map(Number);
    // cria objeto Date no fuso local (sem UTC)
    const dataFinal = new Date(ano, mes - 1, dia);

    const novoEvento = new Evento({
      acesso, tipo_evento, tipo_comida, tipo_bebida,
      num_convidados, data_evento:dataFinal, hora_evento,
      rua, numero, complemento, bairro, cidade, estado, cep,
      usuarioId: req.session.usuarioId
    });

    await novoEvento.save();
    res.redirect('/api/eventos/sucesso');
  } catch (err) {
    console.error('Erro ao cadastrar evento:', err);
    res.status(500).send('Erro ao cadastrar evento.');
  }
});

// Página de detalhes do evento
router.get('/detalhes', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/DetalhesEvento.html'));
});

// Rota que devolve só os eventos em JSON
router.get('/api/meus-eventos/dados', autenticar, async (req, res) => {
  try {
    if (!req.session.usuarioId) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    const eventos = await Evento.find({ usuarioId: req.session.usuarioId });
    res.json(eventos);
  } catch (err) {
    console.error('Erro ao buscar eventos do usuário:', err);
    res.status(500).json({ erro: 'Erro ao buscar eventos' });
  }
});

router.get('/eventos/lista', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/ListaEvent.html'));
});

// Rota para retornar somente as datas dos eventos agendados
router.get('/datas-agendadas', autenticar, async (req, res) => {
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

// API: Buscar evento por ID — essa deve vir por último
router.get('/:id', autenticar, async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).send('Evento não encontrado');
    res.json(evento);
  } catch (err) {
    res.status(500).send('Erro ao buscar evento');
  }
});

// API: Listar todos os eventos (para página de listagem completa)
router.get('/lista-evento', autenticar, async (req, res) => {
  try {
    const eventos = await Evento.find(); // pega todos
    res.json(eventos);
  } catch (err) {
    console.error('Erro ao buscar eventos:', err);
    res.status(500).json({ error: 'Erro ao buscar eventos.' });
  }
});


// API: Deletar evento
router.delete('/:id', autenticar, async (req, res) => {
  try {
    await Evento.findByIdAndDelete(req.params.id);
    res.status(200).send('Evento excluído');
  } catch (err) {
    res.status(500).send('Erro ao excluir evento');
  }
});

// Atualizar evento
router.put('/:id', autenticar, async (req, res) => {
  try {
    const eventoAtualizado = await Evento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(eventoAtualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar evento.' });
  }
});

// Confirmar evento
router.put('/:id/confirmar', autenticar, async (req, res) => {
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
