// middlewares/autenticar.js

// Verifica se o usuário está logado
function autenticar(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({
      mensagem: 'Você precisa estar logado para acessar esta rota.'
    });
  }
  console.log('Usuário autenticado:', req.session.usuario);
  next();
}

// Permite apenas clientes
function apenasClientes(req, res, next) {
  if (req.session.usuario?.tipo !== 'cliente') {
    return res.status(403).json({
      mensagem: 'Acesso permitido apenas para clientes.'
    });
  }
  next();
}

// Permite apenas profissionais
function apenasProfissionais(req, res, next) {
  if (req.session.usuario?.tipo !== 'profissional') {
    return res.status(403).json({
      mensagem: 'Acesso permitido apenas para profissionais.'
    });
  }
  next();
}

// Vários tipos permitidos
function permitirTipos(...tiposPermitidos) {
  return (req, res, next) => {
    if (req.session.usuario && tiposPermitidos.includes(req.session.usuario.tipo)) {
      return next();
    }
    return res.status(403).json({ mensagem: "Acesso negado para este tipo de usuário." });
  };
}

module.exports = {
  autenticar,
  apenasClientes,
  apenasProfissionais,
  permitirTipos
};
