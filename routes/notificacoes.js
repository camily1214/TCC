const express = require('express');
const router = express.Router();
const Notificacao = require('../models/Notificacao');
const { autenticar, apenasClientes, apenasProfissionais } = require('../middlewares/autenticar');

// 🔔 CLIENTE — Buscar todas as notificações (confirmado/cancelado)
router.get('/cliente', autenticar, apenasClientes, async (req, res) => {
  try {
    const notificacoes = await Notificacao.find({
      usuarioId: req.session.usuario.id, // CORREÇÃO: usar session.usuario.id
      tipo: { $in: ['confirmacao', 'cancelamento'] }
    })
      .sort({ createdAt: -1 }) // as mais recentes primeiro
      .lean();

    res.json(notificacoes);
  } catch (err) {
    console.error('Erro ao buscar notificações do cliente:', err);
    res.status(500).json({ erro: 'Erro ao buscar notificações' });
  }
});



// 💼 PROFISSIONAL — Ver novas solicitações de eventos
router.get('/profissional', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const notificacoes = await Notificacao.find({
      tipo: 'solicitacao'
    }).sort({ data: -1 }).lean();

    res.json(notificacoes);
  } catch (err) {
    console.error('Erro ao buscar notificações do profissional:', err);
    res.status(500).json({ erro: 'Erro ao buscar notificações' });
  }
});


// ✅ Marcar uma notificação como lida
router.put('/:id/lida', autenticar, async (req, res) => {
  try {
    await Notificacao.findByIdAndUpdate(req.params.id, { lida: true });
    res.json({ mensagem: 'Notificação marcada como lida' });
  } catch (err) {
    console.error('Erro ao atualizar notificação:', err);
    res.status(500).json({ erro: 'Erro ao atualizar notificação' });
  }
});

// API: Buscar todas as notificações de um cliente
router.get('/notificacoes/cliente', autenticar, apenasClientes, async (req, res) => {
  try {
    const notificacoes = await Notificacao.find({ usuarioId: req.session.usuario.id })
      .sort({ createdAt: -1 }) // as mais recentes primeiro
      .lean();
    
    res.json(notificacoes);
  } catch (err) {
    console.error('Erro ao buscar notificações:', err);
    res.status(500).json({ erro: 'Erro ao buscar notificações.' });
  }
});


module.exports = router;
