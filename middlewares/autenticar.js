// middlewares/autenticar.js

module.exports = (req, res, next) => {
  // Middleware falso (só para não travar o app por enquanto)
  console.log('Middleware de autenticação chamado.');
  next();
};