const mongoose = require('mongoose');

const notificacaoSchema = new mongoose.Schema({
  usuarioId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  titulo: { 
    type: String, 
    required: true 
  },
  mensagem: { 
    type: String, 
    required: true 
  },
  tipo: { 
    type: String, 
    enum: ['solicitacao', 'confirmacao', 'cancelamento'], 
    required: true 
  },
  lida: { 
    type: Boolean, 
    default: false 
  },
  data: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.models.Notificacao || mongoose.model('Notificacao', notificacaoSchema);

