var Blacklist = require('../models/blacklist')

module.exports.consultar = token => {
    return Blacklist
        .findOne({token})
        .exec()
}

module.exports.inserir = obj => {
    var novo = new Blacklist(obj)
    return novo.save()
}

module.exports.remover = token => {
    return Blacklist
        .deleteOne({token})
        .exec()
}