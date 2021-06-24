const mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
    nome: {type: String, required: true},
    nivel: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    dataRegisto: {type: Date, default: Date.now()},
    dataUltimoAcesso: {type: Date, default: Date.now()}
  });

module.exports = mongoose.model('user', userSchema)