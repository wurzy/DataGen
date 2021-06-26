const mongoose = require('mongoose')

var modelSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref:"user" ,required: true},
    modelo: {type: String, required: true},
    visibilidade: {type: Boolean, required: true},
    titulo: {type: String, required: true},
    descricao: {type: String, required: true},
    dataCriacao: {type: Date, required: true}
});

module.exports = mongoose.model('model', modelSchema)