const express = require('express');
const router = express.Router();
const path = require('path');
const Notificacao = require('../models/Notificacao'); 
const Evento = require('../models/profissional/eventos/Event');

// Importar middleware de autenticação
const { autenticar, apenasClientes, apenasProfissionais } = require('../middlewares/autenticar');

// Rota para abrir a página HTML de lista de eventos
router.get('/lista-eventos-html', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/ListaEvent.html'));
});

// Página para escolher data (não precisa login)
router.get('/escolher-data', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EscolherData.html'));
});

// Página de criação de evento (apenas clientes logados podem criar)
router.get('/criar', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/CriarEvent.html'));
});

// NOVO: Página de sucesso após cadastrar evento
router.get('/sucesso', autenticar, apenasClientes, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EventSucesso.html'));
});

// Página de edição de evento (apenas clientes podem editar os próprios eventos)
router.get('/editar', autenticar, apenasClientes, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/EditarEvent.html'));
});

// CANCELAR ALTERAÇÕES (voltar sem salvar) — deve vir ANTES do /:id
router.get('/editar/cancelar', autenticar, apenasClientes, (req, res) => {
  res.redirect('/api/eventos/lista-evento');
});

// Página de pós-login (cliente)
router.get('/pos-login', autenticar, apenasClientes, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/PosLogin.html'));
});

// Página de pós-login do PROFISSIONAL
router.get('/prof-pos-login', autenticar, apenasProfissionais, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/ProfPosLogin.html'));
});

// Página "Meus eventos" (clientes só veem os deles)
router.get('/meus-eventos', autenticar, apenasClientes, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/meus-eventos.html'));
});

// Salvar evento via POST (apenas clientes)
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
      num_convidados, data_evento: dataFinal, hora_evento,
      rua, numero, complemento, bairro, cidade, estado, cep,
      usuarioId: req.session.usuario.id
    });

    await novoEvento.save();

    // 🔔 Criar notificação de solicitação (para profissional)
    const notificacao = new Notificacao({
      usuarioId: req.session.usuario.id, // cliente que criou
      titulo: 'Nova Solicitação de Evento',
      mensagem: `O cliente ${req.session.usuario.nome} solicitou um novo evento.`,
      tipo: 'solicitacao'
    });

    await notificacao.save();

    res.redirect('/api/eventos/sucesso');
  } catch (err) {
    console.error('Erro ao cadastrar evento:', err);
    res.status(500).send('Erro ao cadastrar evento.');
  }
});

// Página de detalhes do evento (qualquer usuário logado pode ver detalhes)
router.get('/detalhes', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/DetalhesEvento.html'));
});

// Rota que devolve só os eventos em JSON (clientes veem só os deles)
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

router.get('/eventos/lista', autenticar, (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/eventos/ListaEvent.html'));
});

// Rota para retornar somente as datas dos eventos agendados (acesso comum)
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

// API: Listar todos os eventos (somente profissionais) com dados formatados
router.get('/lista-evento', autenticar, apenasProfissionais, async (req, res) => {
  try {
        const eventos = await Evento.find()
      .populate('usuarioId', 'nome telefone') // <-- popula somente os campos necessários
      .lean();

    const eventosFormatados = eventos.map(e => {
      const d = new Date(e.data_evento);
      const dataFormatada = d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      const horaFormatada = e.hora_evento || '--:--';

      return {
        _id: e._id,
        status: e.status, // devolve o valor puro do banco ✅
        usuarioNome: e.usuarioId?.nome || '-',
        usuarioTelefone: e.usuarioId?.telefone || '-',
        tipo_evento: e.tipo_evento || '-',
        acesso: e.acesso || '-',
        num_convidados: e.num_convidados || '-',
        tipo_bebida: e.tipo_bebida || '-',
        tipo_comida: e.tipo_comida || '-',
        data_evento: dataFormatada,
        hora_evento: horaFormatada,
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


// API: Buscar evento por ID — (vem depois da lista)
router.get('/:id', autenticar, async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).send('Evento não encontrado');

    // cliente só pode acessar o próprio evento
    if (req.session.usuario.tipo === 'cliente' && evento.usuario.id.toString() !== req.session.usuario.id) {
      return res.status(403).send('Acesso negado');
    }

    res.json(evento);
  } catch (err) {
    res.status(500).send('Erro ao buscar evento');
  }
});

// Atualizar status do evento (confirmado/cancelado) - apenas profissionais
router.put('/:id/status', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const { status } = req.body;

    // Validar o novo status
    if (!['confirmado', 'cancelado'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }

    // Atualiza o evento com novo status
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).json({ erro: 'Evento não encontrado' });

    evento.status = status;
    evento.alteradoPor = req.session.usuario.id;
    evento.dataAlteracaoStatus = new Date();

    await evento.save();

    // Criar notificação para o cliente
    const titulo = status === 'confirmado' ? 'Evento Confirmado' : 'Evento Cancelado';
    const mensagem = status === 'confirmado'
      ? `Seu evento (${evento.tipo_evento}) foi confirmado pelo profissional.`
      : `Seu evento (${evento.tipo_evento}) foi cancelado pelo profissional.`;

    const notificacao = new Notificacao({
      usuarioId: evento.usuarioId,
      titulo,
      mensagem,
      tipo: status
    });
    await notificacao.save();

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


// API: Deletar evento (clientes só podem deletar os próprios, profissional pode deletar qualquer)
router.delete('/:id', autenticar, async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).send('Evento não encontrado');

    if (req.session.usuario.tipo === 'cliente' && evento.usuarioId.toString() !== req.session.usuarioId) {
      return res.status(403).send('Você não pode excluir este evento');
    }

    await Evento.findByIdAndDelete(req.params.id);
    res.status(200).send('Evento excluído');
  } catch (err) {
    res.status(500).send('Erro ao excluir evento');
  }
});


// Atualizar evento (cliente só pode atualizar o próprio)
router.put('/:id', autenticar, async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).send('Evento não encontrado');

    if (req.session.usuario.tipo === 'cliente' && evento.usuarioId.toString() !== req.session.usuarioId) {
      return res.status(403).send('Você não pode atualizar este evento');
    }

    const eventoAtualizado = await Evento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(eventoAtualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar evento.' });
  }
});

// Confirmar evento (apenas profissional pode confirmar)
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
