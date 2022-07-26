var express = require('express');
var router = express.Router();
const utils = require('../utils/utils')

const dslParser = require('../grammars/dsl/parser')
const xmlParser = require('../grammars/xml_schema/parser/parser')

const dslConverter = require('../grammars/dsl/conversions')
const xmlConverter = require('../grammars/xml_schema/converter/converter')

const ws = "‏‏‎ ‎"
const settings_str = `"settings": {\n${ws}${ws}"datagen_language": ?,\n${ws}${ws}"recursion": {"lower": ?, "upper": ?},\n${ws}${ws}"unbounded": ?,\n${ws}${ws}"prob_default": ?,\n${ws}${ws}"prob_nil": ?,\n${ws}${ws}"prob_noAll": ?\n}`

function cleanSettings(settings, frontend) {
  if (frontend) {
    settings.recursion.lower = parseInt(settings.recursion.lower)
    settings.recursion.upper = parseInt(settings.recursion.upper)
    settings.unbounded = parseInt(settings.unbounded)
    settings.prob_default = parseFloat(settings.prob_default)
    settings.prob_nil = parseFloat(settings.prob_nil)
    settings.prob_noAll = parseFloat(settings.prob_noAll)
  }

  if (!(Number.isInteger(settings.recursion.lower) && settings.recursion.lower >= 0)) return "O valor 'recursion.lower' das definições deve ser um inteiro não-negativo!"
  if (!(Number.isInteger(settings.recursion.upper) && settings.recursion.upper >= 0)) return "O valor 'recursion.upper' das definições deve ser um inteiro não-negativo!"
  if (settings.recursion.upper < settings.recursion.lower) return "O valor 'recursion.lower' deve ser inferior ou igual ao 'recursion.upper'!"
  if (!(Number.isInteger(settings.unbounded) && settings.unbounded >= 0)) return "O valor 'unbounded' das definições deve ser um inteiro não-negativo!"
  if (!(typeof settings.prob_default == "number" && settings.prob_default >= 0 && settings.prob_default <= 100)) return "O valor 'prob_default' das definições deve ser um número entre 0 e 100, correspondente à probabilidade pretendida!"
  if (!(typeof settings.prob_nil == "number" && settings.prob_nil >= 0 && settings.prob_nil <= 100)) return "O valor 'prob_nil' das definições deve ser um número entre 0 e 100, correspondente à probabilidade pretendida!"
  if (!(typeof settings.prob_noAll == "number" && settings.prob_noAll >= 0 && settings.prob_noAll <= 100)) return "O valor 'prob_noAll' das definições deve ser um número entre 0 e 100, correspondente à probabilidade pretendida!"
  if (!(typeof settings.datagen_language == "string" && ["pt","en"].includes(settings.datagen_language))) return `O valor 'datagen_language' das definições deve ter um dos seguintes valores: "pt" (português) ou "en" (inglês)!`

  settings.prob_default = parseFloat(settings.prob_default.toFixed(2))/100
  settings.prob_nil = parseFloat(settings.prob_nil.toFixed(2))/100
  settings.prob_noAll = parseFloat(settings.prob_noAll.toFixed(2))/100

  return true
}

function generate(req, frontend) {
  let clean = cleanSettings(req.body.settings, frontend)
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
  
  // gerar dataset
  let dataset = dslParser.parse(model)
  let format = req.body.settings.output
  console.log('dataset gerado')

  // colocar IDs e IDREFs no dataset
  if (/\{DFXS_ID\}/.test(model)) {
    let ids = 0
    ids = utils.replaceIDs(dataset.dataModel.data, ids) 
    
    if (/\{DFXS_IDREF\}/.test(model)) {
      if (!ids) return {message: "O dataset produzido possui 1+ elementos de tipo 'IDREF', mas nenhum elemento de tipo 'ID'!\nÉ possível que os elementos de tipo 'ID' não sejam instanciados, dado que os mesmos, ou os elementos que os contêm, podem não ocorrer devido a restrições de ocorrências/recursividade, como foi o caso nesta instância. Tente gerar outro dataset."}
      utils.replaceIDREFs(dataset.dataModel.data, ids)
    }
  }

  // converter dataset para o formato final
  if (format == "json") dataset = JSON.stringify(dslConverter.cleanJson(dataset.dataModel.data), null, 2)
  if (format == "xml") dataset = dslConverter.jsonToXml(dataset.dataModel.data, {xml_declaration: data.xml_declaration})
  console.log('dataset convertido')

  return {model, dataset}
}

// POST front-end para gerar um dataset a partir de uma schema XML
router.post('/', (req, res) => {
  try {
    res.status(201).jsonp(generate(req, true))
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

    if (!(typeof settings == 'object' && !Array.isArray(settings) && settings !== null && "recursion" in settings && "lower" in settings.recursion && "upper" in settings.recursion && "unbounded" in settings && "prob_default" in settings && "prob_nil" in settings && "prob_noAll" in settings && "datagen_language" in settings))
      return res.status(500).send(`As definições enviadas no corpo do pedido não estão corretas! Devem ser enviadas num objeto com a seguinte estrutura:\n\n${settings_str}`)

    try {
      req.body.settings.output = req.params.output
      let result = generate(req, false)

      if ("message" in result) return res.status(500).send(utils.translateMsg(result, null))
      res.status(201).jsonp(result)
    } catch (err) {
      res.status(500).send(utils.translateMsg(err, null))
    }
  }
  else res.status(500).send(`O corpo do pedido deve ter apenas três propriedades: 'schema', 'element' e 'settings', onde 'element' é o elemento-raiz da schema que se pretende gerar.\nAs definições devem ser enviadas num objeto com a seguinte estrutura:\n\n${settings_str}`)
});

module.exports = router;
