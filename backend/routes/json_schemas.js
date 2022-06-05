var express = require('express');
var router = express.Router();

const dslParser = require('../grammars/datagen_dsl/parser')
const jsonParser = require('../grammars/json_schema/parser/parser')

const dslConverter = require('../grammars/datagen_dsl/conversions')
const jsonConverter = require('../grammars/json_schema/converter/converter')

const {resolve_refs} = require('../grammars/json_schema/converter/refs')

function cleanSettings(settings) {
  settings.recursiv.lower = parseInt(settings.recursiv.lower)
  settings.recursiv.upper = parseInt(settings.recursiv.upper)
  settings.prob_if = parseFloat(parseFloat(settings.prob_if).toFixed(2))/100
  settings.prob_patternProperty = parseFloat(parseFloat(settings.prob_patternProperty).toFixed(2))/100
}

// POST para gerar um dataset a partir de um XML schema
router.post('/', (req, res) => {
  let schema_key = ""

  try {
    // extrair dados da schema
    let data = req.body.schemas.map(x => {schema_key = x.key; return jsonParser.parse(x.content)})
    cleanSettings(req.body.settings)
    //console.log(JSON.stringify(data))
    console.log('schema parsed')
    
    let resolved = resolve_refs(data, req.body.settings)
    if (resolved !== true) return res.status(201).jsonp({message: resolved})

    // criar modelo DSL a partir dos dados da schemas
    let model = jsonConverter.convert(data[0], req.body.settings)
    console.log('modelo criado')
    // gerar dataset
    
    let dataset = dslParser.parse(model)
    let format = req.body.settings.output
    console.log('dataset gerado')

    // converter dataset para o formato final
    if (format == "JSON") dataset = JSON.stringify(dslConverter.cleanJson(dataset.dataModel.data), null, 2)
    if (format == "XML") {
      let schema = data[0].subschemas.pop()
      dataset = dslConverter.jsonToXml(dataset.dataModel.data, {root_name: /^anon\d+$/.test(schema.id) ? "dataset" : schema.id.split("/json-schemas/")[1]})
    }
    console.log('dataset convertido')

    res.status(201).jsonp({model, dataset})
  } catch (err) {
    res.status(201).jsonp({...err, schema_key})
  }
});

module.exports = router;
