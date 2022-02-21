var express = require('express');
var router = express.Router();

const dslParser = require('../grammars/datagen_dsl/parser')
const xmlParser = require('../grammars/xml_schema/parser')

const dslConverter = require('../grammars/datagen_dsl/conversions')
const xmlConverter = require('../grammars/xml_schema/converter/converter');

// POST para gerar um dataset a partir de um XML schema
router.post('/', (req, res) => {
  try {
    // extrair dados da schema
    let data = xmlParser.parse(req.body.xsd)
    //console.log(JSON.stringify(data))
    console.log('schema parsed')
    
    for (let i = 0; i < data.unbounded_min; i++) {
      if (data.unbounded_min[i] > req.body.settings.UNBOUNDED) {
        let message = `Um elemento na schema tem minOccurs='${data.unbounded_min[i]}' e maxOccurs='unbounded', o que é inválido porque o máximo de repetições geráveis está definido como '${req.body.unbounded}'.`
        return res.status(201).jsonp({message})
      }
    }

    // criar modelo DSL a partir dos dados da schemas
    let model = xmlConverter.convert(data.xsd, data.simpleTypes, data.complexTypes, req.body.settings)
    console.log('modelo criado')
    // gerar dataset
    let dataset = dslParser.parse(model)
    let format = req.body.settings.OUTPUT
    console.log('dataset gerado')

    // converter dataset para o formato final
    if (format == "JSON") dataset = dslConverter.cleanJson(dataset.dataModel.data)
    if (format == "XML") dataset = dslConverter.jsonToXml(dataset.dataModel.data, data.xml_declaration)
    console.log('dataset convertido')

    res.status(201)
    if (format == "JSON") res.type('application/json')
    if (format == "XML") res.type('application/xhtml+xml')
    res.write(dataset)
    res.end()

  } catch (err) {
    res.status(404).jsonp(err)
  }
});

module.exports = router;
