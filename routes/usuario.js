const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const Usuario = require('../models/profissional/usuarios/usuarios');

// página de login //
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/Login.html'));
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ mensagem: 'Preencha e‑mail e senha.' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ mensagem: 'Usuário não encontrado.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(400).json({ mensagem: 'Senha incorreta.' });
    }

// Autenticar sessão
req.session.usuarioId = usuario._id;
req.session.tipoUsuario = usuario.tipo; // salvando o tipo na sessão

// Redirecionamento baseado no tipo do usuário
if (usuario.tipo === 'cliente') {
  return res.redirect('/clientes/usuarios/MeuInicial.html');
} else if (usuario.tipo === 'profissional') {
  return res.redirect('/profissionais/usuarios/MeuInicial.html');
} else {
  return res.redirect('/'); // fallback
}

    res.redirect('/');
  } catch (erro) {
    console.error('Erro no login:', erro);
    res.status(500).json({ mensagem: 'Erro ao tentar login.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Erro ao sair.');
    res.redirect('/login');
  });
});

// Página de cadastro
router.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/usuarios/CadUsu.html'));
});

// Página de sucesso
router.get('/cadastro-sucesso', (req, res) => {
  res.sendFile(path.join(__dirname, '../models/profissional/usuarios/CadastroSucesso.html'));
});

// Criar usuário (POST)
router.post('/cadastro', async (req, res) => {
  try {
    const {
      tipo, nome, sobrenome, datanasc, email, genero, telefone, cpf,
      senha, confirmaSenha,
      rua, numero, complemento, bairro, cidade, estado, cep
    } = req.body;

    // Validação de campos obrigatórios
    if (
      !tipo || !nome || !sobrenome || !cpf || !datanasc || !telefone || !genero || !email || !senha || !confirmaSenha ||
      !rua || !numero || !bairro || !cidade || !estado || !cep
    ) {
      return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios.' });
    }

    if (senha !== confirmaSenha) {
      return res.status(400).json({ mensagem: 'As senhas não coincidem.' });
    }

    // Verifica se o CPF já está cadastrado
    const cpfExistente = await Usuario.findOne({ cpf: req.body.cpf });
    if (cpfExistente) {
      return res.status(400).send('CPF já cadastrado.');
    }

    // Verifica se o E-MAIL já está cadastrado
    const emailExistente = await Usuario.findOne({ email: req.body.email });
    if (emailExistente) {
      return res.status(400).send('E-mail já cadastrado.');
    }

    // Criptografar senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // Criar novo usuário
    const novoUsuario = new Usuario({
      tipo,
      nome,
      sobrenome,
      datanasc,
      email,
      genero,
      telefone,
      cpf,
      senha: senhaCriptografada,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep
    });

    await novoUsuario.save();

    res.redirect('/cadastro-sucesso');

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
  }
});

// Rota para retornar todos os usuários
router.get('/lista', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

router.get('/meus-eventos', autenticar, apenasClientes, async (req, res) => {
  try {
    const eventos = await Evento.find({ cliente: req.session.usuarioId });
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar eventos do cliente.' });
  }
});


router.get('/lista-evento', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const eventos = await Evento.find().populate('cliente', 'nome telefone');
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ mensagem: 'Erro ao buscar eventos para profissional.' });
  }
});

// Rota para deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    res.status(200).json({ mensagem: 'Usuário excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// middlewares/auth.js
function autenticar(req, res, next) {
  if (req.session.usuarioId) return next();
  return res.redirect('/login');
}

function apenasClientes(req, res, next) {
  if (req.session.tipoUsuario === 'cliente') return next();
  return res.status(403).send('Acesso permitido apenas para clientes.');
}

function apenasProfissionais(req, res, next) {
  if (req.session.tipoUsuario === 'profissional') return next();
  return res.status(403).send('Acesso permitido apenas para profissionais.');
}

module.exports = { autenticar, apenasClientes, apenasProfissionais };

// Rota GET para listar todos os usuários (interface HTML) COM LOG PARA DEBUG
router.get('/ListaUsu', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    console.log("Usuários encontrados:", usuarios); // log para debug
    res.json(usuarios);
  } catch (erro) {
    console.error("Erro ao buscar usuários:", erro);
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

module.exports = router;
