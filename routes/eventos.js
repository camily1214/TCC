const express = require('express');
const router = express.Router();
const path = require('path');
const Evento = require('../models/profissional/eventos/Event');

// Importar middlewares de autenticação
const { autenticar, apenasClientes, apenasProfissionais } = require('../middlewares/autenticar');

// Lista de eventos
router.get('/lista-eventos-html', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/ListaEvent.html'));
});

// Escolher data
router.get('/escolher-data', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EscolherData.html'));
});

// Criar evento
router.get('/criar', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/CriarEvent.html'));
});

// Sucesso após cadastrar evento
router.get('/sucesso', autenticar, apenasClientes, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EventSucesso.html'));
});

// Editar evento
router.get('/editar', autenticar, (req, res) => {
  const filePath = path.join(__dirname, '../models/profissional/eventos/EditarEvent.html');
  res.sendFile(filePath, {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    }
  });
});

// Cancelar edição
router.get('/editar/cancelar', autenticar, apenasClientes, (req, res) => {
  res.redirect('/api/eventos/lista-evento');
});

// Pós-login (cliente)
router.get('/pos-login', autenticar, apenasClientes, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/PosLogin.html'));
});

// Pós-login (profissional)
router.get('/prof-pos-login', autenticar, apenasProfissionais, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/ProfPosLogin.html'));
});

// Meus eventos (clientes)
router.get('/meus-eventos', autenticar, apenasClientes, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/meus-eventos.html'));
});

// Detalhes de evento
router.get('/detalhes', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/DetalhesEvento.html'));
});

// Lista completa (HTML)
router.get('/eventos/lista', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/ListaEvent.html'));
});

// 🔹 API - EVENTOS

// Criar novo evento
router.post('/novo-evento', autenticar, async (req, res) => {
  try {
    const {
      acesso, tipo_evento, tipo_comida, tipo_bebida,
      num_convidados, data_evento, hora_evento, hora_fim_evento, descricao_evento,
      rua, numero, complemento, bairro, cidade, estado, cep,
    } = req.body;

    // Converter data para objeto Date
    const [ano, mes, dia] = data_evento.split('-').map(Number);
    const dataFinal = new Date(ano, mes - 1, dia);

    // Criar novo evento
    const novoEvento = new Evento({
      acesso,
      tipo_evento,
      tipo_comida,
      tipo_bebida,
      num_convidados,
      data_evento: dataFinal,
      hora_evento,
      hora_fim_evento,
      descricao_evento,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      usuarioId: req.session.usuario.id
    });

    await novoEvento.save();

    // Retorna JSON de sucesso com tipo de usuário
    res.json({ 
      sucesso: true, 
      mensagem: 'Evento cadastrado com sucesso!',
      tipoUsuario: req.session.usuario.tipo
    });

  } catch (err) {
    console.error('Erro ao cadastrar evento:', err);
    res.status(500).json({ erro: 'Erro ao cadastrar evento' });
  }
});

// Retornar eventos do cliente logado
router.get('/meus-eventos/dados', autenticar, apenasClientes, async (req, res) => {
  try {
    if (!req.session.usuario.id) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    const eventos = await Evento.find({ usuarioId: req.session.usuario.id });
    res.json(eventos);
  } catch (err) {
    console.error('Erro ao buscar eventos do usuário:', err);
    res.status(500).json({ erro: 'Erro ao buscar eventos' });
  }
});

router.get('/datas-agendadas', async (req, res) => {
  try {
    // Apenas eventos confirmados pelo profissional
    const eventosConfirmados = await Evento.find(
      { status: 'confirmado' },
      'data_evento'
    );

    const datasConfirmadas = eventosConfirmados.map(e =>
      e.data_evento.toISOString().split('T')[0]
    );

    res.json(datasConfirmadas);
  } catch (err) {
    console.error('Erro ao buscar datas confirmadas:', err);
    res.status(500).json({ erro: 'Erro ao buscar eventos confirmados' });
  }
});

// 🔹 Listar apenas eventos recentes (últimos 15 dias e futuros)
router.get('/lista-evento', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const hoje = new Date();
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() - 15); // 15 dias atrás

    const eventos = await Evento.find({ data_evento: { $gte: limite } })
      .populate('usuarioId', 'nome telefone')
      .sort({ data_evento: 1 })
      .lean();

    const eventosFormatados = eventos.map(e => {
      let dataFormatada = '-';
      if (e.data_evento) {
        try {
          let dataObj;
          if (e.data_evento instanceof Date && !isNaN(e.data_evento)) {
            dataObj = e.data_evento;
          } else if (typeof e.data_evento === 'string') {
            dataObj = new Date(e.data_evento);
          }

          if (dataObj && !isNaN(dataObj.getTime())) {
            dataFormatada = dataObj.toLocaleDateString('pt-BR', {
              timeZone: 'America/Sao_Paulo'
            });
          }
        } catch (err) {
          console.error('Erro ao formatar data:', e.data_evento, err);
        }
      }

      return {
        _id: e._id,
        status: e.status || 'aguardando',
        usuarioNome: e.usuarioId?.nome || '-',
        usuarioTelefone: e.usuarioId?.telefone || '-',
        tipo_evento: e.tipo_evento || '-',
        acesso: e.acesso || '-',
        num_convidados: e.num_convidados || '-',
        tipo_bebida: e.tipo_bebida || '-',
        tipo_comida: e.tipo_comida || '-',
        data_evento: e.data_evento ? e.data_evento.toISOString() : null,
        hora_evento: e.hora_evento || '--:--',
        hora_fim_evento: e.hora_fim_evento || '--:--',
        descricao_evento: e.descricao_evento || '-',
        rua: e.rua || '-',
        numero: e.numero || '-',
        complemento: e.complemento || '-',
        bairro: e.bairro || '-',
        cidade: e.cidade || '-',
        estado: e.estado || '-',
        cep: e.cep || '-'
      };
    });

    res.json(eventosFormatados);
  } catch (err) {
    console.error('Erro ao buscar eventos recentes:', err);
    res.status(500).json({ erro: 'Erro ao buscar eventos recentes.' });
  }
});


// Buscar evento por ID
router.get('/:id', autenticar, async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).send('Evento não encontrado');

    if (req.session.usuario.tipo === 'cliente' && evento.usuarioId.toString() !== req.session.usuario.id) {
      return res.status(403).send('Acesso negado');
    }

    res.json(evento);
  } catch (err) {
    res.status(500).send('Erro ao buscar evento');
  }
});

// Atualizar status (profissional)
router.put('/:id/status', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const { status, motivo_cancelamento } = req.body;

    // Verificação de status válido
    if (!['confirmado', 'cancelado'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }

    // Busca o evento
    const evento = await Evento.findById(req.params.id);
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    // Atualiza os campos
    evento.status = status;
    evento.dataAlteracaoStatus = new Date();

    // Se o status for cancelado, salva o motivo
    if (status === 'cancelado') {
      if (!motivo_cancelamento || motivo_cancelamento.trim() === '') {
        return res.status(400).json({ erro: 'O motivo do cancelamento é obrigatório.' });
      }
      evento.motivo_cancelamento = motivo_cancelamento.trim();
    } else {
      evento.motivo_cancelamento = null;
    }

    await evento.save();

    res.json({
      sucesso: true,
      mensagem: `Status atualizado para "${status}" com sucesso.`,
      evento
    });

  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    res.status(500).json({ erro: 'Erro ao atualizar status.' });
  }
});

// Atualizar evento (cliente ou profissional autorizado)
router.put("/:id", autenticar, async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).json({ erro: "Evento não encontrado" });

    // Permissão
    if (usuario.tipo === "cliente" && evento.usuarioId.toString() !== usuario.id) {
      return res.status(403).json({ erro: "Você não tem permissão para editar este evento." });
    }

    // Corrigir formato da data
    if (req.body.data_evento) {
      const [ano, mes, dia] = req.body.data_evento.split('-').map(Number);
      req.body.data_evento = new Date(ano, mes - 1, dia);
    }

    const eventoAtualizado = await Evento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ sucesso: true, evento: eventoAtualizado });
  } catch (err) {
    console.error("Erro ao atualizar evento:", err);
    res.status(500).json({ erro: "Erro ao atualizar evento." });
  }
});


// Deletar evento
router.delete('/:id', autenticar, async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).send('Evento não encontrado');

    if (req.session.usuario.tipo === 'cliente' && evento.usuarioId.toString() !== req.session.usuario.id) {
      return res.status(403).send('Você não pode excluir este evento');
    }

    await Evento.findByIdAndDelete(req.params.id);
    res.status(200).send('Evento excluído');
  } catch (err) {
    res.status(500).send('Erro ao excluir evento');
  }
});

// Confirmar evento (profissional)
router.put('/:id/confirmar', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const evento = await Evento.findByIdAndUpdate(
      req.params.id,
      { confirmado: true },
      { runValidators: false }
    );
    if (!evento) return res.status(404).send('Evento não encontrado');
    res.json(evento);
  } catch (err) {
    res.status(500).send('Erro ao confirmar evento');
  }
});

module.exports = router;
