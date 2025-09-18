const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const Usuario = require('../models/profissional/usuarios/usuarios');
const Evento = require('../models/profissional/eventos/Event');


// Importar middleware de autenticação
const { autenticar, apenasClientes, apenasProfissionais } = require('../middlewares/autenticar');

/* --ROTAS DE PÁGINAS--*/

// Página de login
router.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../models/Login.html'));
});

// Página de cadastro
router.get('/cadastro', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../models/profissional/usuarios/CadUsu.html'));
});

// Página de sucesso
router.get('/cadastro-sucesso', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../models/profissional/usuarios/CadastroSucesso.html'));
});

// Página HTML de listagem de usuários (apenas profissionais)
router.get('/ListaUsu', autenticar, apenasProfissionais, (req, res) => {
  res.sendFile(path.resolve(__dirname, '../models/profissional/usuarios/ListaUsu.html'));
});

router.get('/pos-login', autenticar, apenasClientes, (req, res) => {
  res.redirect('/api/eventos/pos-login');
});

/* ---ROTAS DE AUTENTICAÇÃO---*/

// Rota de login
router.post('/login', async (req, res) => {
  console.log('req.body:', req.body); // <--- debug
  try {
    const { email, senha, tipo } = req.body;

    // 1. Busca usuário pelo email
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
      return res.status(400).json({ mensagem: 'Usuário não encontrado.' });
    }

    // 2. Confere se o tipo bate
    if (!usuario.tipo || usuario.tipo.toLowerCase() !== tipo.toLowerCase()) {
      return res.status(403).json({
        mensagem: 'Tipo de usuário incorreto. Selecione corretamente Cliente ou Profissional.'
      });
    }

    // 3. Verifica senha
    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) {
      return res.status(401).json({ mensagem: 'Senha incorreta.' });
    }

    // 4. Cria sessão
    req.session.usuario = {
      id: usuario._id.toString(),
      email: usuario.email,
      tipo: usuario.tipo
    };

    res.json({ mensagem: 'Login realizado com sucesso', tipo: usuario.tipo });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ mensagem: 'Erro no servidor.' });
  }
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
      !tipo || !nome || !sobrenome || !cpf || !datanasc || !telefone || !genero ||
      !email || !senha || !confirmaSenha || !rua || !numero || !bairro || !cidade || !estado || !cep
    ) {
      return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios.' });
    }

    if (senha !== confirmaSenha) {
      return res.status(400).json({ mensagem: 'As senhas não coincidem.' });
    }

    // Verifica se o CPF já está cadastrado
    const cpfExistente = await Usuario.findOne({ cpf });
    if (cpfExistente) {
      return res.status(400).json({ mensagem: 'CPF já cadastrado.' });
    }

    // Verifica se o E-MAIL já está cadastrado
    const emailExistente = await Usuario.findOne({ email });
    if (emailExistente) {
      return res.status(400).json({ mensagem: 'E-mail já cadastrado.' });
    }

    // Criptografar senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    // Criar novo usuário
    const novoUsuario = new Usuario({
      tipo: tipo.toLowerCase(), // garante "cliente" ou "profissional"
      nome,
      sobrenome,
      datanasc: new Date(datanasc),
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
    console.error('Erro ao cadastrar usuário:', erro);
    res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
  }
});

// Lista todos os usuários (somente profissionais)
router.get('/usuarios/listaUsu', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-senha'); // não retorna senha
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});


// Rota para buscar todos os usuários em JSON
router.get('/dados', async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

// Deletar usuário + eventos vinculados (somente profissionais)
router.delete('/:id', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const { id } = req.params;

    // Apagar usuário
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    // Apagar eventos relacionados a esse usuário
    await Evento.deleteMany({ usuarioId: id });

    res.status(200).json({ mensagem: 'Usuário e eventos excluídos com sucesso.' });
  } catch (err) {
    console.error("Erro ao deletar usuário e eventos:", err);
    res.status(500).json({ erro: 'Erro ao excluir usuário: ' + err.message });
  }
});


// Rota GET para listar todos os usuários com log de debug (somente profissionais)
router.get('/api/usuarios/debug', autenticar, apenasProfissionais, async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    console.log("Usuários encontrados:", usuarios);
    res.json(usuarios);
  } catch (erro) {
    console.error("Erro ao buscar usuários:", erro);
    res.status(500).json({ erro: 'Erro ao buscar usuários' });
  }
});

router.get('/tipo', (req, res) => {
  if (req.session.usuario) {
    res.json({ tipo: req.session.usuario.tipo }); // cliente ou profissional
  } else {
    res.json({ tipo: null });
  }
});

module.exports = router;
