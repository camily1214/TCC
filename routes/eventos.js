const express = require('express');
const router = express.Router();
const path = require('path');
const Evento = require('../models/profissional/eventos/Event');

// Importar middlewares de autenticação
const { autenticar, apenasClientes, apenasProfissionais } = require('../middlewares/autenticar');

// 🔹 PÁGINAS HTML

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
      num_convidados, data_evento, hora_evento,
      rua, numero, complemento, bairro, cidade, estado, cep,
    } = req.body;

    const [ano, mes, dia] = data_evento.split('-').map(Number);
    const dataFinal = new Date(ano, mes - 1, dia);

    const novoEvento = new Evento({
      acesso, tipo_evento, tipo_comida, tipo_bebida,
      num_convidados, data_evento: dataFinal, hora_evento,
      rua, numero, complemento, bairro, cidade, estado, cep,
      usuarioId: req.session.usuario.id
    });

    await novoEvento.save();
    res.redirect('/api/eventos/sucesso');
  } catch (err) {
    console.error('Erro ao cadastrar evento:', err);
    res.status(500).send('Erro ao cadastrar evento.');
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

// Datas agendadas (para calendário)
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

// Listar todos os eventos (profissionais)
router.get('/lista-evento', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const eventos = await Evento.find().populate('usuarioId', 'nome telefone').lean();

    const eventosFormatados = eventos.map(e => {
      let dataFormatada = '-';
      if (e.data_evento) {
        try {
          const dataObj = typeof e.data_evento === 'string'
            ? new Date(e.data_evento + 'T00:00:00')
            : new Date(e.data_evento);

          if (!isNaN(dataObj.getTime())) {
            dataFormatada = dataObj.toLocaleDateString('pt-BR', {
              timeZone: 'America/Sao_Paulo'
            });
          }
        } catch {
          dataFormatada = '-';
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
        data_evento: dataFormatada,
        hora_evento: e.hora_evento || '--:--',
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
    console.error('Erro ao buscar eventos:', err);
    res.status(500).json({ error: 'Erro ao buscar eventos.' });
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
    const { status } = req.body;
    if (!['confirmado', 'cancelado'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }

    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).json({ erro: 'Evento não encontrado' });

    evento.status = status;
    evento.dataAlteracaoStatus = new Date();
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

// Atualizar evento
router.put('/:id', autenticar, async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).json({ erro: 'Evento não encontrado' });

    Object.assign(evento, req.body);
    await evento.save();

    res.json({ sucesso: true, mensagem: 'Evento atualizado com sucesso.' });
  } catch (err) {
    console.error('Erro ao atualizar evento:', err);
    res.status(500).json({ erro: 'Erro ao atualizar evento.' });
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
      { new: true }
    );
    if (!evento) return res.status(404).send('Evento não encontrado');
    res.json(evento);
  } catch (err) {
    res.status(500).send('Erro ao confirmar evento');
  }
});

module.exports = router;
