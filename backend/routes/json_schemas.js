var express = require('express');
var router = express.Router();

const dslParser = require('../grammars/datagen_dsl/parser')
const jsonParser = require('../grammars/json_schema/parser/parser')

const dslConverter = require('../grammars/datagen_dsl/conversions')
const jsonConverter = require('../grammars/json_schema/converter/converter')

const {resolve_refs} = require('../grammars/json_schema/converter/refs')
const {translateMsg} = require('../utils/utils')

const ws = "‏‏‎ ‎"
const settings_str = `"settings": {\n${ws}${ws}"recursivity": {"lower": ?, "upper": ?},\n${ws}${ws}"prob_if": ?,\n${ws}${ws}"prob_patternProperty": ?,\n${ws}${ws}"random_props": ?,\n${ws}${ws}"extend_objectProperties": ?,\n${ws}${ws}"prefixItems": ?,\n${ws}${ws}"extend_schemaProperties": ?\n}`
const isObject = x => typeof x == 'object' && !Array.isArray(x) && x !== null

function cleanSettings(settings, frontend) {
  if (frontend) {
    settings.recursivity.lower = parseInt(settings.recursivity.lower)
    settings.recursivity.upper = parseInt(settings.recursivity.upper)
  }

  if (!(Number.isInteger(settings.recursivity.lower) && settings.recursivity.lower >= 0)) return "O valor 'recursivity.lower' das definições deve ser um inteiro não-negativo!"
  if (!(Number.isInteger(settings.recursivity.upper) && settings.recursivity.upper >= 0)) return "O valor 'recursivity.upper' das definições deve ser um inteiro não-negativo!"
  if (settings.recursivity.upper < settings.recursivity.lower) return "O valor 'recursivity.lower' deve ser inferior ou igual ao 'recursivity.upper'!"
  if (!(typeof settings.prob_if == "number" && settings.prob_if >= 0 && settings.prob_if <= 100)) return "O valor 'prob_if' das definições deve ser um número entre 0 e 100, correspondente à probabilidade pretendida!"
  if (!(typeof settings.prob_patternProperty == "number" && settings.prob_patternProperty >= 0 && settings.prob_patternProperty <= 100)) return "O valor 'prob_patternProperty' das definições deve ser um número entre 0 e 100, correspondente à probabilidade pretendida!"
  if (!typeof settings.random_props == "boolean") return "O valor 'random_props' das definições deve ser um boleano!"

  if (!frontend) {
    if (!(typeof settings.extend_objectProperties == "string" && ["extend","overwrite"].includes(settings.extend_objectProperties))) return "O valor 'extend_objectProperties' das definições, relativo à extensão de propriedades repetidas nas chaves 'properties' e 'patternProperties', deve ser uma das seguintes strings:\n\n• extend/overwrite - se as chaves tiverem propriedades repetidas, estende/subtitui a schema de cada propriedade da chave-base com a respetiva schema da mesma propriedade da chave nova. Todas as propriedades originais da nova chave são atribuídas à chave-base."
    if (!(typeof settings.extend_schemaProperties == "string" && ["extend","overwrite"].includes(settings.extend_schemaProperties))) return "O valor 'extend_schemaProperties' das definições, relativo à extensão de chaves cujo valor é uma subschema ('propertyNames', 'additionalProperties', 'unevaluatedProperties', 'items' ou 'unevaluatedItems'), deve ser uma das seguintes strings:\n\n• extend/overwrite - estende/substitui a schema da chave-base com a schema da chave nova."
    if (!(typeof settings.extend_prefixItems == "string" && ["extend","partial_overwrite","total_overwrite","append"].includes(settings.extend_prefixItems))) return "O valor 'extend_prefixItems' das definições, relativo à extensão da chave 'prefixItems', deve ser uma das seguintes strings:\n\n• extend - para todas as schemas que se encontram no mesmo índice, estende as da chave-base com as respetivas schemas da nova chave. Se a chave nova tiver mais elementos do que a base, os elementos extra são também concatenados;\n• append - os elementos do novo 'prefixItems' são concatenados aos da chave-base;\n• partial_overwrite - sobrescreve apenas as schemas da chave-base com uma schema correspondente no mesmo índice, na chave nova. Se a chave nova tiver mais elementos do que a base, os elementos extra são também concatenados;\n• total_overwrite - o valor da chave-base é apagado totalmente e substítuido pelo array do novo 'prefixItems'."
    
    settings.extend_objectProperties = settings.extend_objectProperties == "extend" ? "OR" : "OW"
    settings.extend_schemaProperties = settings.extend_schemaProperties == "extend" ? "OR" : "OW"
    settings.extend_prefixItems = settings.extend_prefixItems == "extend" ? "OR" : (settings.extend_prefixItems == "append" ? "AP" : (settings.extend_prefixItems == "partial_overwrite" ? "OWP" : "OWT"))
  }

  settings.prob_if = parseFloat(parseFloat(settings.prob_if).toFixed(2))/100
  settings.prob_patternProperty = parseFloat(parseFloat(settings.prob_patternProperty).toFixed(2))/100

  return true
}

function generate(req, data) {
  let clean = cleanSettings(req.body.settings, true)
  if (typeof clean == "string") return {message: clean}
  
  let resolved = resolve_refs(data, req.body.settings)
  if (resolved !== true) return {message: resolved}

  // criar modelo DSL a partir dos dados da schemas
  let model = jsonConverter.convert(data[0], req.body.settings)
  console.log('modelo criado')

  // gerar dataset
  let dataset = dslParser.parse(model)
  let format = req.body.settings.output
  console.log('dataset gerado')

  // converter dataset para o formato final
  if (format == "json") dataset = JSON.stringify(dslConverter.cleanJson(dataset.dataModel.data), null, 2)
  if (format == "xml") {
    let schema = data[0].subschemas.pop()
    dataset = dslConverter.jsonToXml(dataset.dataModel.data, {root_name: /^anon\d+$/.test(schema.id) ? "dataset" : schema.id.split("/json-schemas/")[1]})
  }
  console.log('dataset convertido')

  return {model, dataset}
}

// POST front-end para gerar um dataset a partir de uma schema JSON
router.post('/', (req, res) => {
  let schema_key = ""

  try {
    // extrair dados da schema
    console.log(req.body.schemas)
    let data = req.body.schemas.map(x => {schema_key = x.key; return jsonParser.parse(x.content)})
    //console.log(JSON.stringify(data))
    console.log('schema parsed')

    res.status(201).jsonp(generate(req, data))
  } catch (err) {
    res.status(201).jsonp({...err, schema_key})
  }
});

// POST back-end para gerar um dataset a partir de uma schema JSON
router.post('/:output', (req, res) => {
  if (req.params.output != "xml" && req.params.output != "json") return res.sendStatus(404)

  if (Object.keys(req.body).length == 3 && "main_schema" in req.body && "other_schemas" in req.body && "settings" in req.body) {
    req.body.settings.output = req.params.output
    let settings = req.body.settings

    if (!isObject(req.body.main_schema)) return res.status(500).send("A schema principal deve ser enviada em forma de objeto JSON!")
    if (!(Array.isArray(req.body.other_schemas) && req.body.other_schemas.every(x => isObject(x)))) return res.status(500).send("O valor de 'other_schemas' deve ser um array com as restantes schemas, todas elas em forma de objeto JSON!")

    if (!("recursivity" in settings && "lower" in settings.recursivity && "upper" in settings.recursivity && "prob_if" in settings && "prob_patternProperty" in settings && "random_props" in settings && "extend_objectProperties" in settings && "extend_prefixItems" in settings && "extend_schemaProperties" in settings))
      return res.status(500).send(`As definições enviadas no pedido não estão corretas! Devem ser enviadas num objeto com a seguinte estrutura:\n\n${settings_str}`)
    
    let clean = cleanSettings(req.body.settings, false)
    if (typeof clean == "string") return res.status(500).send(clean)

    let schema_key = ""
    let schemas = [JSON.stringify(req.body.main_schema, null, 2), ...req.body.other_schemas.map(x => JSON.stringify(x, null, 2))]
    try {
      // extrair dados da schema
      let data = schemas.map((x,i) => {schema_key = i; return jsonParser.parse(x)})
      console.log('schema parsed')

      let result = generate(req, data)
      if ("message" in result) return res.status(500).send(result.message)
      res.status(201).jsonp(result)
    } catch (err) {
      res.status(500).send(`Erro na ${!schema_key ? "schema principal" : `${schema_key}º schema das restantes`}:\n` + translateMsg(err, schemas[schema_key]))
    }
  }
  else res.status(500).send(`O corpo do pedido deve ter apenas três propriedades: 'main_schema', 'other_schemas' e 'settings'.\nAs definições devem ser enviadas num objeto com a seguinte estrutura:\n\n${settings_str}`)
});

module.exports = router;
