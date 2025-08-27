// middlewares/autenticar.js
module.exports = (req, res, next) => {
  if (req.session && req.session.usuarioId) {
    // Usuário está logado
    console.log('Usuário autenticado:', req.session.usuarioId);
    return next();
  } else {
    console.log('Tentativa de acesso sem login.');
    return res.status(401).json({
      mensagem: 'Você precisa estar logado para acessar esta rota.'
    });
  }
};
