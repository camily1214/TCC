require('dotenv').config();

const express    = require('express');
const path       = require('path');
const mongoose   = require('mongoose');
const cors       = require('cors');
const session    = require('express-session');

// Rotas //
const usuarioRoutes = require('./routes/usuario');
const eventosRoutes = require('./routes/eventos');

const app  = express();
const PORT = process.env.PORT || 3000;

// CONEXÃO COM O BANCO DE DADOS //
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://camily1213:202011@cluster15.dtjlpwl.mongodb.net/tcc?retryWrites=true&w=majority&appName=Cluster15';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB conectado!'))
  .catch(err  => console.error('Erro ao conectar no MongoDB:', err));

// MIDDLEWARES //
app.use(cors({
  origin: 'http://localhost:3000', // ou a origem do seu frontend
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão temporária em memória (desaparece ao reiniciar o servidor)
app.use(session({
  secret: 'chave-secreta',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// VIEWS (caso use EJS em alguma parte) //
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ARQUIVOS ESTÁTICOS //
app.use(express.static(path.join(__dirname, 'public')));
app.use('/imagens',    express.static(path.join(__dirname, 'imagens')));
app.use('/components', express.static(path.join(__dirname, 'public/components')));
app.use('/css',        express.static(path.join(__dirname, 'public/css')));
app.use(express.static(path.join(__dirname, 'models'))); // serve HTML diretamente

// ROTAS DE API //
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/eventos', eventosRoutes);

// ROTAS DE PÁGINAS HTML //
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/PaginaInicial.html'));
});

// Página para o cliente criar evento //
app.get('/clientes/eventos/criar', (req, res) => {
  const caminho = path.join(__dirname, 'models', 'clientes', 'eventos', 'CriarEventCliente.html');
  res.sendFile(caminho);
});

// Página para o profissional criar evento //
app.get('/profissionais/eventos/criar', (req, res) => {
  const caminho = path.join(__dirname, 'models', 'profissional', 'eventos', 'CriarEvent.html');
  res.sendFile(caminho);
});

app.get('/usuarios/CadUsus.html', (req, res) =>
  res.sendFile(path.join(__dirname, 'models/profissional/usuarios/CadUsu.html'))
);

// Cadastro com sucesso //
app.get('/cadastro-sucesso', (req, res) =>
  res.sendFile(path.join(__dirname, 'models/profissional/usuarios/CadastroSucesso.html'))
);

// Lista de usuários //
app.get('/usuarios/ListaUsu.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'models/profissional/usuarios/ListaUsu.html'));
});

app.get('/clientes/eventos/meuseventos', (req, res) => {
  const caminhoArquivo = path.join(__dirname, 'models', 'clientes', 'eventos', 'MeusEvent.html');
  res.sendFile(caminhoArquivo);
});

// Página de login //
app.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, 'models/Login.html')) 
);

// 404 - ROTA NÃO ENCONTRADA //
app.use((_req, res) => res.status(404).send('Página não encontrada.'));

// INICIAR SERVIDOR //
app.listen(PORT, () =>
  console.log(`Servidor rodando em: http://localhost:${PORT}`)
);
