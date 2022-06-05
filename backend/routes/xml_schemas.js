var express = require('express');
var router = express.Router();
const fs = require('fs')

const dslParser = require('../grammars/datagen_dsl/parser')
const xmlParser = require('../grammars/xml_schema/parser/parser')

const dslConverter = require('../grammars/datagen_dsl/conversions')
const xmlConverter = require('../grammars/xml_schema/converter/converter');

function cleanSettings(settings) {
  settings.unbounded = parseInt(settings.unbounded)
  settings.recursiv.lower = parseInt(settings.recursiv.lower)
  settings.recursiv.upper = parseInt(settings.recursiv.upper)
}

// POST para gerar um dataset a partir de um XML schema
router.post('/', (req, res) => {
  try {
    // extrair dados da schema
    let data = xmlParser.parse(req.body.xsd)
    cleanSettings(req.body.settings)
    //console.log(JSON.stringify(data))
    console.log('schema parsed')
    
    for (let i = 0; i < data.unbounded_min; i++) {
      if (data.unbounded_min[i] > req.body.settings.unbounded) {
        let message = `Um elemento na schema tem minOccurs='${data.unbounded_min[i]}' e maxOccurs='unbounded', o que é inválido porque o máximo de repetições geráveis está definido como '${req.body.unbounded}'.`
        return res.status(201).jsonp({message})
      }
    }

    // criar modelo DSL a partir dos dados da schemas
    let model = xmlConverter.convert(data.xsd, data.simpleTypes, data.complexTypes, req.body.element, req.body.settings)
    console.log('modelo criado')
    // Write data in 'Output.txt' .
    /* fs.writeFile('modelo.txt', model, (err) => {
        // In case of a error throw err.
        if (err) throw err;
    }) */
    
    // gerar dataset
    let dataset = dslParser.parse(model)
    let format = req.body.settings.output
    console.log('dataset gerado')

    // converter dataset para o formato final
    if (format == "JSON") dataset = JSON.stringify(dslConverter.cleanJson(dataset.dataModel.data), null, 2)
    if (format == "XML") dataset = dslConverter.jsonToXml(dataset.dataModel.data, {xml_declaration: data.xml_declaration})
    console.log('dataset convertido')

    res.status(201).jsonp({model, dataset})
  } catch (err) {
    res.status(201).jsonp(err)
  }
});

router.post('/elements', (req, res) => {
  try {
    let data = xmlParser.parse(req.body.xsd)
    res.status(201).jsonp({elements: data.xsd.content.filter(x => x.element == "element").map(x => x.attrs.name)})
  } catch (err) {
    res.status(201).jsonp(err)
  }
})

module.exports = router;
