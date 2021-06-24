var User = require('../models/user')

module.exports.listar = () => {
    return User
        .find()
        .sort('nome')
        .exec()
}

module.exports.consultar = email => {
    return User
        .findOne({email})
        .exec()
}

module.exports.consultarMuitos = ids => {
    return User
        .find({_id: {$in: ids}}, {nome: 1})
        .exec()
}

module.exports.inserir = user => {
    var novo = new User(user)
    return novo.save()
}

module.exports.remover = email => {
    return User.deleteOne({email})
}

module.exports.alterar = user => {
    return User.findByIdAndUpdate({email: user.email}, user, {new: true})
}