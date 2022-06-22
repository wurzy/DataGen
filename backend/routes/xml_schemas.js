var express = require('express');
var router = express.Router();
const {translateMsg} = require('../utils/utils')
const fs = require('fs')

const dslParser = require('../grammars/datagen_dsl/parser')
const xmlParser = require('../grammars/xml_schema/parser/parser')

const dslConverter = require('../grammars/datagen_dsl/conversions')
const xmlConverter = require('../grammars/xml_schema/converter/converter');

const ws = "‏‏‎ ‎"
const settings_str = `"settings": {\n${ws}${ws}"recursivity": {"lower": ?, "upper": ?},\n${ws}${ws}"unbounded": ?\n}`

function cleanSettings(settings, frontend) {
  if (frontend) {
    settings.unbounded = parseInt(settings.unbounded)
    settings.recursivity.lower = parseInt(settings.recursivity.lower)
    settings.recursivity.upper = parseInt(settings.recursivity.upper)
  }

  if (!(Number.isInteger(settings.unbounded) && settings.unbounded >= 0)) return "O valor 'unbounded' das definições deve ser um inteiro não-negativo!"
  if (!(Number.isInteger(settings.recursivity.lower) && settings.recursivity.lower >= 0)) return "O valor 'recursivity.lower' das definições deve ser um inteiro não-negativo!"
  if (!(Number.isInteger(settings.recursivity.upper) && settings.recursivity.upper >= 0)) return "O valor 'recursivity.upper' das definições deve ser um inteiro não-negativo!"
  if (settings.recursivity.upper < settings.recursivity.lower) return "O valor 'recursivity.lower' deve ser inferior ou igual ao 'recursivity.upper'!"

  return true
}

function generate(req) {
  let clean = cleanSettings(req.body.settings, true)
  if (typeof clean == "string") return {message: clean}

  // extrair dados da schema
  let data = xmlParser.parse(req.body.schema)
  console.log('schema parsed')

  let root_elements = data.xsd.content.filter(x => x.element == "element").map(x => x.attrs.name)
  if (!root_elements.includes(req.body.element)) return {message: `O elemento '${req.body.element}' indicado para gerar o dataset não existe na raiz da schema!`}
  
  for (let i = 0; i < data.unbounded_min; i++) {
    if (data.unbounded_min[i] > req.body.settings.unbounded) {
      return {message: `Um elemento na schema tem minOccurs=${data.unbounded_min[i]} e maxOccurs="unbounded", o que é inválido porque o máximo de repetições está definido como ${req.body.settings.unbounded} nas definições (que o utilizador pode customizar).`}
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
  if (format == "json") dataset = JSON.stringify(dslConverter.cleanJson(dataset.dataModel.data), null, 2)
  if (format == "xml") dataset = dslConverter.jsonToXml(dataset.dataModel.data, {xml_declaration: data.xml_declaration})
  console.log('dataset convertido')

  return {model, dataset}
}

// POST front-end para gerar um dataset a partir de uma schema XML
router.post('/', (req, res) => {
  try {
    res.status(201).jsonp(generate(req))
  } catch (err) {
    res.status(201).jsonp(err)
  }
});

router.post('/elements', (req, res) => {
  try {
    let data = xmlParser.parse(req.body.schema)
    res.status(201).jsonp({elements: data.xsd.content.filter(x => x.element == "element").map(x => x.attrs.name)})
  } catch (err) {
    res.status(201).jsonp(err)
  }
})

// POST back-end para gerar um dataset a partir de uma schema XML
router.post('/:output', (req, res) => {
  if (req.params.output != "xml" && req.params.output != "json") return res.sendStatus(404)

  if (Object.keys(req.body).length == 3 && "schema" in req.body && "element" in req.body && "settings" in req.body) {
    let settings = req.body.settings

    if (typeof req.body.schema != "string") return res.status(500).send("A schema deve ser enviada em string!")
    if (typeof req.body.element != "string") return res.status(500).send("O nome do elemento-raiz a gerar deve ser uma string!")

    if (!(typeof settings == 'object' && !Array.isArray(settings) && settings !== null && "unbounded" in settings && "recursivity" in settings && "lower" in settings.recursivity && "upper" in settings.recursivity))
      return res.status(500).send(`As definições enviadas no corpo do pedido não estão corretas! Devem ser enviadas num objeto com a seguinte estrutura:\n\n${settings_str}`)
    
    let clean = cleanSettings(req.body.settings, false)
    if (typeof clean == "string") return res.status(500).send(clean)

    try {
      req.body.settings.output = req.params.output
      let result = generate(req)

      if ("message" in result) return res.status(500).send(translateMsg(result, null))
      res.status(201).jsonp(result)
    } catch (err) {
      res.status(500).send(translateMsg(err, null))
    }
  }
  else res.status(500).send(`O corpo do pedido deve ter apenas três propriedades: 'schema', 'element' e 'settings', onde 'element' é o elemento-raiz da schema que se pretende gerar.\nAs definições devem ser enviadas num objeto com a seguinte estrutura:\n\n${settings_str}`)
});

module.exports = router;
