var jwt = require('jsonwebtoken');
var express = require('express');
var router = express.Router();

const secret = 'LEI2021_SECRET_!_HASH'
const Model = require('../controllers/model')
const User = require('../controllers/user')

function unveilToken(token){  
    token = token.split(" ")[1] // Bearer ey341...
    var t = null;
    
    jwt.verify(token,secret,function(e,decoded){
      if(e){
        t = null
      }
      else return t = decoded
    })

    return t
}

function forbidden(res){
    res.status(403).jsonp({erro: "Não tem acesso à operação."})
}

// Todos os modelos disponiveis publicamente
router.get('/publicos',function(req,res){
    Model.listar()
        .then(dados => {
            var map = new Map()
            dados.forEach(m => {
                map.set(m.user, 0)
            })
            User.consultarMuitos([...map.keys()])
                .then(dados2 => res.status(200).jsonp({models: dados, users: dados2}))
                .catch(e => res.status(500).jsonp(e))
        })
        .catch(e => res.status(500).jsonp(e))
})

// Todos os modelos de um utilizador (id)
router.get('/utilizador/:id', function(req,res){
    var token = unveilToken(req.headers.authorization)
    if(!token || token._id != req.params.id) forbidden(res)
    else {
        Model.consultarTodos(token._id)
            .then(dados => res.status(200).jsonp(dados))
            .catch(e => res.status(500).jsonp(e))
    }
})

// Todos os modelos visiveis por um utilizador (publicos e os seus privados)
router.get('/visiveis/:id', function(req,res){
    var token = unveilToken(req.headers.authorization)
    if(!token || token._id != req.params.id) forbidden(res)
    else {
        Model.consultarVisiveis(token._id)
            .then(dados => {
                var map = new Map()
                dados.forEach(m => {
                    map.set(m.user, 0)
                })
                User.consultarMuitos([...map.keys()])
                    .then(dados2 => res.status(200).jsonp({models: dados, users: dados2}))
                    .catch(e => res.status(500).jsonp(e))
            })
            .catch(e => res.status(500).jsonp(e))
    }
})

// Adicionar um novo modelo
router.post('/adicionar', function(req,res){
    var token = unveilToken(req.headers.authorization)
    if(!token) forbidden(res)
    else {
        req.body["user"] = token._id
        Model.inserir(req.body)
            .then(dados => res.status(201).jsonp(dados))
            .catch(e => res.status(500).jsonp({error: "Não foi possível guardar o modelo."}))
    }
})

// Guardar alterações num modelo
router.put('/alterar/:id', function(req,res){
    var token = unveilToken(req.headers.authorization)
    Model.consultar(req.params.id)
        .then(dados => {
            if(!token || dados.user != token._id) forbidden(res)
            else {
                Model.alterar(req.params.id, req.body.visibilidade, req.body.modelo)
                    .then(dados => res.status(201).jsonp(dados))
                    .catch(e => res.status(500).jsonp(e))
            }
        })
        .catch(e => res.status(500).jsonp(e))
})

router.delete('/:id', function(req,res){
    var token = unveilToken(req.headers.authorization)
    Model.consultar(req.params.id)
        .then(dados => {
            if(!token || dados.user != token._id) forbidden(res)
            else {
                Model.remover(req.params.id)
                    .then(dados => res.status(201).jsonp(dados))
                    .catch(e => res.status(500).jsonp(e))
            }
        })
    .catch(e => res.status(500).jsonp(e))
})

module.exports = router;