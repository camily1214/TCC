// middlewares/auth.js

function autenticar(req, res, next) {
  if (!req.session || !req.session.usuarioId) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado' });
  }
  next();
}

function apenasClientes(req, res, next) {
  if (req.session.tipoUsuario !== 'cliente') {
    return res.status(403).json({ mensagem: 'Apenas clientes têm acesso' });
  }
  next();
}

function apenasProfissionais(req, res, next) {
  if (req.session.tipoUsuario !== 'profissional') {
    return res.status(403).json({ mensagem: 'Apenas profissionais têm acesso' });
  }
  next();
}

module.exports = {
  autenticar,
  apenasClientes,
  apenasProfissionais
};
