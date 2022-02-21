const express = require('express');
const router = express.Router();

var fs = require('fs')
const FormData = require('form-data')
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const parser = require('../grammars/datagen_dsl/parser')
const converter = require('../grammars/datagen_dsl/conversions')

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

// POST para uso em aplicações
router.post('/dfs', upload.single('model'), function(req,res){
    let model = fs.readFileSync(req.file.path, "utf8")
    
    try {
        data = parser.parse(model)

        if (req.body.output_format == "JSON") data = converter.cleanJson(data.dataModel.data)
        if (req.body.output_format == "XML") data = converter.jsonToXml(data.dataModel.data, req.body.xml_declaration)
        console.log(data)

        fs.writeFileSync('./output/dataset.txt', JSON.stringify(data), function (err) {
            if (err) return console.log(err)
        });
      
        const formData = new FormData()
        let file = fs.readFileSync('./output/dataset.txt', "utf8")
        formData.append('dataset', file, "dataset.txt")

        res.writeHead(201, {
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename=dataset.txt'
        });
        res.write(file)
        res.end()
    } catch (err) {
        console.log(err)
        res.status(404).jsonp(err)
    }
})

module.exports = router;