let current_key = ""
let stringKeys = ["minLength","maxLength","pattern","format"]
let numericKeys = ["multipleOf","minimum","exclusiveMinimum","maximum","exclusiveMaximum"]
let objectKeys = ["properties","patternProperties","additionalProperties","unevaluatedProperties","required","propertyNames","minProperties","maxProperties","dependentRequired","dependentSchemas"]
let arrayKeys = ["items","prefixItems","unevaluatedItems","contains","minContains","maxContains","minItems","maxItems","uniqueItems"]

// função do PEG.js para retornar erro
let error

// formatar os dados para a estrutura intermédia pretendida
function structureSchemaData(obj, boolean, vars) {
  current_key = vars.current_key
  error = vars.error

  if (boolean === false && current_key != "if") return boolean

  if (obj === null) {
    if (boolean !== false && current_key == "not") return error("Uma subschema dentro da chave <b>not</b> não pode ser <i>true</i> ou <i>{}</i>, pois a sua negação impede a geração de qualquer valor!")
    else obj = {type: ["string","integer","number","boolean","null","array","object"], booleanSchema: boolean}
  }
  else if (["string","number","boolean","null","array","object"].every(t => obj.type.includes(t)) && current_key == "not") return error("Uma subschema dentro da chave <b>not</b> não pode ser <i>true</i> ou <i>{}</i>, pois a sua negação impede a geração de qualquer valor!")
  else if ("not" in obj && obj.not === false) {
    if (!obj.type.length) obj.type = ["string","integer","number","boolean","null","array","object"]
    delete obj.not
  }
  else if ("$ref" in obj && (Object.keys(obj).length > 2 || obj.type.length > 0)) return error("O DataGen From Schemas não permite que uma schema com uma <b>$ref</b> possua qualquer outra chave!")

  let schema = {type: {}}

  for (let k of obj.type) {
    if (k == "integer") {
      if (!("number" in schema.type)) schema.type.number = {}
      schema.type.number.integer = true
    }
    else schema.type[k] = {}
  }

  for (let k in obj) {
    if (k == "type") ;
    else if (k == "_datagen") {
      let v_type = obj[k].type == "integer" ? "number" : obj[k].type
      if (!(v_type in schema.type)) schema.type[v_type] = {}
      schema.type[v_type][k] = obj[k]
      delete schema.type[v_type][k].type
    }
    else if (k == "const" || k == "default") {
      let v_type = getValueType(obj[k][0])
      if (!(v_type in schema.type)) schema.type[v_type] = {}
      schema.type[v_type][k] = obj[k]
    }
    else if (k == "enum") structureEnum(schema, obj[k])
    else if (k == "not") structureGeneric(schema, obj[k], k)
    else if (["allOf","anyOf","oneOf"].includes(k)) structureSchemaCompArr(schema, obj[k], k)
    else if (k == "if") {
      structureGeneric(schema, obj[k], k)
      if ("then" in obj) structureGeneric(schema, obj.then, "then")
      if ("else" in obj) structureGeneric(schema, obj.else, "else")
    }
    else if (numericKeys.includes(k)) schema.type.number[k] = obj[k]
    else if (stringKeys.includes(k)) schema.type.string[k] = obj[k]
    else if (objectKeys.includes(k)) schema.type.object[k] = obj[k]
    else if (arrayKeys.includes(k)) schema.type.array[k] = obj[k]
    else if (!["then","else"].includes(k)) schema[k] = obj[k]
  }

  schemaComp_specific(obj, schema)

  // verificar a coerência das chaves numéricas
  if ("number" in schema.type) {
    let valid = checkNumericKeys(schema.type.number)
    if (valid !== true) return valid
  }

  if (current_key == "if") {
    if (boolean !== null) {
      for (let type in schema.type) schema.type[type].booleanSchema = boolean
    }
    else if (Object.keys(obj).length == 1 && "type" in obj) {
      for (let type of obj.type) schema.type[type].typeSchema = true
    }
  }

  if (!Object.keys(schema.type).length) delete schema.type
  if (!("type" in schema)) {
    // as seguintes chaves são as não tipadas, segundo a estrutura intermédia desta gramática
    // se as chaves da schema forem um subset destas, então inicialmente é possível gerar qualquer tipo de dados (que pode ser restringido pela 'not')
    if (Object.keys(obj).every(k => ["$id","$schema","$anchor","$defs","not"].includes(k) || (k == "type" && !obj[k].length)))
      obj.type = ["string","number","boolean","null","array","object"]

    // a schema é um subset das chaves {$id, $schema, $anchor, $ref, $defs}
    if (Object.keys(obj).every(k => /^$/.test(k) || (k == "type" && !obj[k].length))) {
      // se a schema só tiver um subset das chaves {$id, $schema, $anchor, $defs}, pode gerar qualquer tipo de valor
      if (!Object.keys(schema).includes("$ref")) schema.type = {string: {}, number: {}, boolean: {}, null: {}, array: {}, object: {}}
    }

    // se tiver um 'not', é necessário verificar se está a proibir todos os tipos geráveis ou não
    if ("not" in obj) {
      let allowedTypes = obj.type.filter(k => !(k in obj.not.type))
      if (allowedTypes.includes("integer") && "number" in obj.not.type) allowedTypes.splice(allowedTypes.indexOf("integer"), 1)

      if (!allowedTypes.length) return error(`Não é possível gerar nenhum valor a partir da schema em questão!`)
      else {
        schema.type = {}
        allowedTypes.map(k => schema.type[k] = {})
      }
    }
  }

  return schema
}

// retorna o tipo de um valor explícito (não considera inteiros porque são classificados como numbers na estrutura gerada pela DSL)
function getValueType(value) {
  if (Array.isArray(value)) return "array"
  else if (value === null) return "null"
  return typeof value
}

function schemaComp_specific(obj, schema) {
  // se um tipo presente na schema do not não tiver nenhuma chave específica, esse tipo é proibido
  if ("not" in obj) {
    for (let t in obj.not.type) {
      let keys = Object.keys(obj.not.type[t])

      if (!keys.length) delete schema.type[t]
      else if (t == "number" && keys.length == 1 && keys.includes("integer")) {
        if ("number" in schema.type && "integer" in schema.type.number) {
          if (obj.type.includes("number")) delete schema.type[t].integer
          else delete schema.type[t]
        }
      }
    }
  }
  
  let schemaComp_keys = Object.keys(obj).filter(k => ["allOf","anyOf","oneOf"].includes(k))

  // para cumprir uma chave de composição de schemas, é necessário que o tipo gerado seja um dos permitidos pelas suas subschemas
  // logo, elimina-se todos os outros presentes na estrutura intermédia
  schemaComp_keys.map(k => {
    let allowedTypes = obj[k].reduce((a,c) => {
      let type = "$ref" in c ? "undef" : Object.keys(c.type)[0]
      if (!a.includes(type)) a.push(type)
      return a
    }, [])

    if (!(allowedTypes.length == 1 && allowedTypes.includes("undef"))) {
      for (let t in schema.type) {
        if (!allowedTypes.includes(t)) delete schema.type[t]
      }
    }
  })
  
  // verificar se é possível cumprir as chaves de composição de schemas presentes
  for (let i = 0; i < schemaComp_keys.length; i++) {
    if (!checkKeyExistence(obj, schema, schemaComp_keys[i], 0)) return error(`Com a schema em questão, é impossível cumprir a chave <b>${schemaComp_keys[i]}</b>, dado que não é possível gerar nenhum dos tipos de dados das suas subschemas!`)
  }

  return true
}

// verificar se uma chave de composição de schema existe na estrutura intermédia, ou se foi completamente elimanada por uma chave 'not'
function checkKeyExistence(json, schema, key, depth) {
	let keys = Array.isArray(schema) ? [...Array(schema.length).keys()] : Object.keys(schema)
	
	for (let i = 0; i < keys.length; i++) {
  	let k = keys[i]
  	if (k == key) return true
    else if (typeof schema[k] === 'object' && schema[k] !== null && checkKeyExistence(json, schema[k], key, depth+1)) return true
	  }

  // se a chave não estiver presente, é possível que seja válida na mesma se possuir uma subschema vazia de um certo tipo e esse tipo for gerável
  if (!depth) {
    let allowedTypes = json[key].reduce((a,c) => {
      let type = "$ref" in c ? "undef" : Object.keys(c.type)[0]
      if (!Object.keys(c.type[type]).length && !a.includes(type)) a.push(type)
      return a
    }, [])

    if (allowedTypes.some(x => x in schema.type)) return true
  }
	  else return false
}

// formatar um enum para a estrutura intermédia pretendida
function structureEnum(schema, arr) {
  // separar os elementos da enumeração por tipos
  let by_types = arr.reduce((obj,elem) => {
    let v_type = getValueType(elem)
    if (!(v_type in obj)) obj[v_type] = []
    obj[v_type].push(elem)
    return obj
  }, {})

  // cada subdivisão é tornada numa enum nova e colocada no respetivo tipo, na estrutura intermédia
  for (let type in by_types) {
    if (!(type in schema.type)) schema.type[type] = {}
    schema.type[type].enum = by_types[type]
  }
}

function structureGeneric(schema, subschema, key) {
  if ("$ref" in subschema) {
    if (!("undef" in schema.type)) schema.type.undef = {}
    schema.type.undef[key] = subschema
  }

  for (let type in subschema.type) {
    if (!(type in schema.type)) schema.type[type] = {}
    schema.type[type][key] = subschema.type[type]
  }
}

// formata uma chave de composição de schemas para a estrutura intermédia pretendida
function structureSchemaCompArr(schema, arr, key) {
  // separar os elementos do all/any/oneOf por tipos (garantido que cada elemento tem um único tipo, graças à checkCompositionTypes)
  let by_types = arr.reduce((obj,elem) => {
    // se uma schema não tiver tipo, é porque tem apenas um subset das seguintes chaves: $ref, $defs ou chaves de composição de schemas
    // no converter é preciso reprocessar o que estiver neste tipo "undef" - se tem uma ref, terá novos dados, senão pode-se eliminar
    let el_type = "$ref" in elem ? "undef" : Object.keys(elem.type)[0]
    if (!(el_type in obj)) obj[el_type] = []

    if (el_type == "undef") obj[el_type].push(elem)
    // não vale a pena guardar uma schema vazia
    else if (Object.keys(elem.type[el_type]).length > 0) obj[el_type].push(elem.type[el_type])
    return obj
  }, {})

  // cada subdivisão é tornada num all/any/oneOf novo e colocado no respetivo tipo, na estrutura intermédia
  for (let type in by_types) {
    if (!(type in schema.type)) schema.type[type] = {}

    // se não houver schemas neste tipo (nenhuma schema foi guardada acima porque eram todas vazias - só foi especificado mesmo o tipo em cada uma), não vale a pena fazer mais nada
    // haverá a possibilidade de gerar este tipo na mesma, porque já foi colocado na estrutura intermédia na linha de código acima
    if (by_types[type].length > 0) {
        if (key in schema.type[type]) schema.type[type][key] = schema.type[type][key].concat(by_types[type])
        else schema.type[type][key] = by_types[type]
    }
  }
}

// verificar que as chaves de tipo numérico são todas coerentes e gerar o modelo da DSL para gerar um valor correspondente
function checkNumericKeys(obj) {
  let {multipleOf, minimum, maximum, exclusiveMinimum, exclusiveMaximum} = obj
  if (multipleOf === undefined) multipleOf = 1
  else multipleOf = multipleOf[0]

  let frac = multipleOf % 1 != 0
  let max = null, min = null
  let upper = null, lower = null
  let int_multiples = []

  if (maximum !== undefined) max = maximum
  if (exclusiveMaximum !== undefined) max = exclusiveMaximum - (frac ? 0.0000000001 : 1)

  if (minimum !== undefined) min = minimum
  if (exclusiveMinimum !== undefined) min = exclusiveMaximum + (frac ? 0.0000000001 : 1)

  if (max !== null && min !== null) {
    upper = Math.floor(max/multipleOf)
    lower = Math.ceil(min/multipleOf)
    
    if (upper - lower < 0) return error(`Não existem múltiplos do número <i>${multipleOf}</i> no intervalo de valores especificado com as chaves de alcance!`)
    else if (frac && "integer" in obj) {
      let decimal_part = parseFloat((multipleOf % 1).toFixed(4))

      for (let i = lower; i <= upper; i++) {
        if ((decimal_part * i) % 1 == 0) int_multiples.push(i)
      }

      if (!int_multiples.length) return error(`Não existem múltiplos inteiros do número <i>${multipleOf}</i> no intervalo de valores especificado com as chaves de alcance!`)
    }
  }
  
  return true
}


module.exports = { structureSchemaData }