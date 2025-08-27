require('dotenv').config();

const express    = require('express');
const path       = require('path');
const mongoose   = require('mongoose');
const cors       = require('cors');
const session    = require('express-session');

// Rotas
const usuarioRoutes = require('./routes/usuario');   // ← Nome correto (singular)
const eventosRoutes = require('./routes/eventos');   // ← Eventos

const app  = express();
const PORT = process.env.PORT || 3000;

// CONEXÃO COM O BANCO DE DADOS //
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://camily1213:202011@cluster15.dtjlpwl.mongodb.net/tcc?retryWrites=true&w=majority&appName=Cluster15';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB conectado!'))
  .catch(err  => console.error('Erro ao conectar no MongoDB:', err));

// MIDDLEWARES //
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão para login
// app.use(session({
//  secret: process.env.SESSION_SECRET || 'segredo_super_seguro',
//  resave: false,
//  saveUninitialized: false,
//  cookie: { secure: false }
// }));

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
app.use('/api/usuarios', usuarioRoutes);   // ✅ apenas essa
app.use('/api/eventos', eventosRoutes);

// ROTAS DE PÁGINAS HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'models/Login.html'));
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
app.get('/usuarios/ListaUsu.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'models/profissional/usuarios/ListaUsu.html'));
});

// Página de login
app.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, 'models/Login.html'))
);

// 404
app.use((_req, res) => res.status(404).send('Página não encontrada.'));

// INICIAR SERVIDOR
app.listen(PORT, () =>
  console.log(`Servidor rodando em: http://localhost:${PORT}`)
);