const express = require('express');
const router = express.Router();

const parser = require('../grammars/dsl/parser')
const converter = require('../grammars/dsl/conversions')

// POST front-end route para obter a informação toda
router.post('/', function(req,res){
    let model = req.body
    try {
        data = parser.parse(model)
        res.status(201).jsonp({...data})
    } catch (err) {
        console.log(err)
        res.status(201).jsonp(err)
    }
})

// POST para uso em aplicações
router.post('/json', function(req,res){
    let model = req.body 
    try {
        data = parser.parse(model)
        res.status(201).jsonp(converter.cleanJson(data.dataModel.data))
    } catch (err) {
        console.log(err)
        res.status(404).jsonp(err)
    }
})

// POST para uso em aplicações
router.post('/xml', function(req,res){
    let model = req.body 
    try {
        data = parser.parse(model)
        res.status(201)
        res.type('text/xml')
        res.write(converter.jsonToXml(data.dataModel.data))
        res.end()
    } catch (err) {
        console.log(err)
        res.status(404).jsonp(err)
    }
})

// POST para uso em aplicações
router.post('/csv', function(req,res){
    let model = req.body
    try {
        data = parser.parse(model)
        csvData = converter.jsonToCsv(data.dataModel, data.collection_ids)
        if (typeof csvData != "string") res.status(404).jsonp({error: csvData.error})
        else { 
            res.status(201)
            res.type('text/csv')
            res.write(csvData)
            res.end()
        }
    } catch (err) {
        res.status(404).jsonp(err)
    }
})

module.exports = router;