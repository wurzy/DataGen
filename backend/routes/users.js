var jwt = require('jsonwebtoken');
var passport = require('passport');
var express = require('express');
var router = express.Router();

const secret = 'LEI2021_SECRET_!_HASH'
const Blacklist = require('../controllers/blacklist')

// Verifica se token expirado
router.get('/verificar/:token', function(req,res){
  jwt.verify(req.params.token,secret,function(e,decoded){
    if(e){
      res.status(404).jsonp({error: "O token é inválido: " + e})
    }
    else res.status(200).jsonp({msg: "Token válido."})
  }) 
})

// login de utilizador
router.post('/login', passport.authenticate('login-auth'), function(req, res) {
  if (req.user.success) {
    jwt.sign({
      _id: req.user.user._id,
      nome: req.user.user.nome,
      email: req.user.user.email,
      nivel: req.user.user.nivel,
      dataRegisto: req.user.user.dataRegisto,
      dataUltimoAcesso: req.user.user.dataUltimoAcesso,
      sub: 'LEI2021'}, 
      secret,
      {expiresIn: "30d"},
      function(e, token) {
        if(e) res.status(500).jsonp({error: "Erro na geração do token: " + e}) 
        else res.status(201).jsonp({token})
    })
  }
  else res.status(500).jsonp({invalidInput: req.user.invalidInput, error: req.user.message}) 
})

// logout de utilizador
router.post('/logout', function(req,res){
  const token = req.body.token
  const dataExp = new Date()
  Blacklist.inserir({token,dataExp})
    .then(r => res.status(201).jsonp(r))
    .catch(e => res.status(500).jsonp(e))
})

// registo de utilizador
router.post('/registar', passport.authenticate('signup-auth'), function(req, res) {
  if (req.user.success) {
    res.status(201).jsonp(req.user.user) 
  }
  else res.status(500).jsonp({invalidInput: req.user.invalidInput, error: req.user.message}) 
})

// obter informação contida no token
router.get('/:token', function(req,res) {
  Blacklist.consultar(req.params.token)
    .then(dados => { res.status(500).jsonp({error: "Token expirado"})})
    .catch(error => {
      jwt.verify(req.params.token,secret,function(e,decoded){
        if(e){
          res.status(404).jsonp({error: "O token é inválido: " + e})
        }
        else res.status(200).jsonp(decoded)
      })
    })
})

module.exports = router;
