var Model = require('../models/model')

module.exports.listar = () => {
    return Model
        .find({visibilidade: true})
        .sort('-dataCriacao')
        .exec()
}

module.exports.consultar = id => {
    return Model
        .findOne({_id: id})
        .exec()
}

module.exports.consultarTodos = user => {
    return Model
        .find({user})
        .sort('-dataCriacao')
        .exec()
}

module.exports.consultarVisiveis = user => {
    return Model
        .find({$or: [{visibilidade: true}, {user}]})
        .sort('-dataCriacao')
        .exec()
}

module.exports.inserir = model => {
    var novo = new Model(model)
    return novo.save()
}

module.exports.remover = id => {
    return Model
        .deleteOne({_id: id})
        .exec()
}

module.exports.alterar = model => {
    return Model
        .findByIdAndUpdate({_id: model._id}, model, {new: true})
        .exec()
}

module.exports.alterarVisibilidade = (id,visibilidade) => {
    return Model
        .updateOne({_id: id}, {visibilidade})
        .exec()
}