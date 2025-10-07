require('dotenv').config();

const express    = require('express');
const path       = require('path');
const mongoose   = require('mongoose');
const cors       = require('cors');
const session    = require('express-session');
const Evento = require('./models/profissional/eventos/Event');

const usuarioRoutes = require('./routes/usuario');
const eventosRoutes = require('./routes/eventos');
const notificacoesRoutes = require('./routes/notificacoes');

const app  = express();
const PORT = process.env.PORT || 3000;

// CONEXÃO COM O BANCO DE DADOS
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://camily1213:202011@cluster15.dtjlpwl.mongodb.net/tcc?retryWrites=true&w=majority&appName=Cluster15';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB conectado!'))
  .catch(err  => console.error('Erro ao conectar no MongoDB:', err));

// MIDDLEWARES
app.use(cors({
  origin: 'http://localhost:3000', // frontend (troca se usar outra porta)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão para login (DESCOMENTADO)
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo_super_seguro',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // se usar HTTPS -> true
}));

app.use('/api/notificacoes', notificacoesRoutes);

// VIEWS (se usar EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ARQUIVOS ESTÁTICOS
app.use(express.static(path.join(__dirname, 'public')));
app.use('/imagens',    express.static(path.join(__dirname, 'imagens')));
app.use('/components', express.static(path.join(__dirname, 'public/components')));
app.use('/css',        express.static(path.join(__dirname, 'public/css')));
app.use(express.static(path.join(__dirname, 'models')));

// ROTAS DE API
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/eventos', eventosRoutes);

// ROTAS DE PÁGINAS HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'models/PaginaInicial.html'));
});

// Cadastro de usuário
app.get('/usuarios/CadUsu.html', (req, res) =>
  res.sendFile(path.join(__dirname, 'models/profissional/usuarios/CadUsu.html'))
);

// Cadastro com sucesso
app.get('/cadastro-sucesso', (req, res) =>
  res.sendFile(path.join(__dirname, 'models/profissional/usuarios/CadastroSucesso.html'))
);

// Lista de usuários
app.get('/eventos/ProfPosLogin', (req, res) => {
  res.sendFile(path.join(__dirname, 'models/profissional/eventos/ProfPosLogin.html'));
});

// Página de login
app.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, 'models/Login.html'))
);

// 🔔 Páginas de notificações
app.get('/notificacoes/cliente', (req, res) => {
  res.sendFile(path.join(__dirname, 'models/profissional/usuarios/NotificacoesCliente.html'));
});

app.get('/notificacoes/profissional', (req, res) => {
  res.sendFile(path.join(__dirname, 'models/profissional/eventos/NotificacoesProfissional.html'));
});



app.get('/eventos/meus-eventos.html', async (req, res) => {
  try {
    if (!req.session.usuario.id) return res.redirect('/login');

    // Busca os eventos do usuário logado
    const eventos = await Evento.find({ usuarioId: req.session.usuario.id });

    // Renderiza usando EJS
    res.render('MeusEventos', { eventos }); 
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao carregar eventos');
  }
});


// 404
app.use((_req, res) => res.status(404).send('Página não encontrada.'));

// INICIAR SERVIDOR
app.listen(PORT, () =>
  console.log(`Servidor rodando em: http://localhost:${PORT}`)
);