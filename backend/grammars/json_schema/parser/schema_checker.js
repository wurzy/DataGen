let genericKeys = ["type","enum","const","default","_datagen"]
let annotationKeys = ["title","description","examples","readOnly","writeOnly","deprecated","$comment"] // a gramática reconhece mas ignora
let mediaKeys = ["contentMediaType","contentEncoding","contentSchema"] // a gramática reconhece mas ignora
let schemaKeys = ["allOf","anyOf","oneOf","not","if","then","else"]
let structuringKeys = ["$schema","$id","$anchor","$ref","$defs"]

let stringKeys = ["minLength","maxLength","pattern","format"]
let numericKeys = ["multipleOf","minimum","exclusiveMinimum","maximum","exclusiveMaximum"]
let objectKeys = ["properties","patternProperties","additionalProperties","unevaluatedProperties","required","propertyNames","minProperties","maxProperties","dependentRequired","dependentSchemas"]
let arrayKeys = ["items","prefixItems","unevaluatedItems","contains","minContains","maxContains","minItems","maxItems","uniqueItems"]

// função do PEG.js para retornar erro
let error
// verificar se objeto tem todas as propriedades em questão
const hasAll = (k, obj) => typeof k == "string" ? k in obj : k.every(key => key in obj)
// verificar se objeto alguma das propriedades em questão
const hasAny = (k, obj) => k.some(key => key in obj)

// fazer todas as verificações necessárias para garantir que a schema está bem escrita
function checkSchema(s, pegjs_error) {
  error = pegjs_error
  s = determineType(s)

  return checkKeysByType(s) && checkRangeKeywords(s) && checkDependentRequired(s) && checkDependentSchemas(s) && checkRequiredProps(s) && checkMaxProperties(s) && 
         checkContains(s) && checkArrayLength(s) && checkEnumArray(s) && checkPredefinedValueType(s) && checkIfThenElse(s) && checkContentSchema(s)
}

// determinar o tipo do valor, se a chave 'type' não for especificada
function determineType(obj) {
  if (obj === null) return {type: ["string"]}

  if (!hasAll("type", obj)) {
    let type = []

    for (let k in obj) {
      if (stringKeys.includes(k)) type.push("string")
      if (numericKeys.includes(k)) type.push("number")
      if (objectKeys.includes(k)) type.push("object")
      if (arrayKeys.includes(k)) type.push("array")
    }

    obj.type = [...new Set(type)]
  }

  return obj
}

// verificar que não se usam chaves específicas a tipos nos tipos errados
function checkKeysByType(obj) {
  let keywords = genericKeys.concat(annotationKeys, mediaKeys, schemaKeys, structuringKeys)
  
  for (let i = 0; i < obj.type.length; i++) {
    switch (obj.type[i]) {
      case "string": keywords = keywords.concat(stringKeys); break
      case "integer": case "number": keywords = keywords.concat(numericKeys); break
      case "object": keywords = keywords.concat(objectKeys); break
      case "array": keywords = keywords.concat(arrayKeys); break
    }
  }

  for (let k in obj) {
    if (!keywords.includes(k)) return error(`O tipo {<b>${obj.type.join("</b>, <b>")}</b>} não suporta a chave <b>${k}</b>!`)
    if (k == "_datagen" && !(obj.type.includes(obj[k].type) || (obj[k].type == "integer" && obj.type.includes("number")) || (obj[k].type == "number" && obj.type.includes("integer")))) return error(`O tipo de dados produzido pela função <b>${obj[k].func}</b> do DataGen não é suportado pela schema em questão!`)
  }
      
  return true
}

// verificar a coerência das chaves de alcance de tipos númericos e string
function checkRangeKeywords(obj) {
  let min = null, max = null, emin = null, emax = null

  if (hasAll("minimum", obj)) min = obj.minimum
  if (hasAll("maximum", obj)) max = obj.maximum
  if (hasAll("exclusiveMinimum", obj)) emin = obj.exclusiveMinimum
  if (hasAll("exclusiveMaximum", obj)) emax = obj.exclusiveMaximum

  if (min !== null && max !== null && min > max) return error(`O valor da chave <b>minimum</b> deve ser &#60;= ao da chave <b>maximum</b>!`)
  if (min !== null && emax !== null && min >= emax) return error(`O valor da chave <b>minimum</b> deve ser &#60; ao da chave <b>exclusiveMaximum</b>!`)
  if (max !== null && emin !== null && max <= emin) return error(`O valor da chave <b>maximum</b> deve ser &#62; ao da chave <b>exclusiveMinimum</b>!`)

  if (min !== null && emin !== null) {
    if (emin >= min) delete obj.minimum
    else delete obj.exclusiveMinimum
  }
  if (max !== null && emax !== null) {
    if (emax <= max) delete obj.maximum
    else delete obj.exclusiveMaximum
  }

  if (hasAll(["maxLength", "minLength"], obj) && obj.minLength > obj.maxLength) return error(`O valor da chave <b>minLength</b> deve ser &#60;= ao da chave <b>maxLength</b>!`)

  return true
}

// verificar que todas as propriedades referidas na chave 'dependentRequired' são válidas
function checkDependentRequired(obj) {
  if (hasAll("dependentRequired", obj)) {
    for (let key in obj.dependentRequired) {
      // remover propriedades repetidas
      obj.dependentRequired[key] = [...new Set(obj.dependentRequired[key])]
      let array_value = obj.dependentRequired[key]

      // se tiver a propriedade dependente dela mesma, remover porque é redundante
      if (array_value.includes(key)) obj.dependentRequired[key].splice(obj.dependentRequired[key].indexOf(key), 1)
    }

    if (hasAll("required", obj)) {
      for (let i = 0; i < obj.required.length; i++) {
        let k = obj.required[i]
        if (k in obj.dependentRequired) obj.required = obj.required.concat(obj.dependentRequired[k].filter(x => !obj.required.includes(x)))
      }
    }
  }
  return true
}

// verificar que todas as subschemas definidas na chave 'dependentSchemas' são válidas
function checkDependentSchemas(obj) {
  if (hasAll("dependentSchemas", obj)) {
    for (let k in obj.dependentSchemas) {
      if ("type" in obj.dependentSchemas[k]) {
        let type_keys = Object.keys(obj.dependentSchemas[k].type)
        if (type_keys.length > 1 || type_keys[0] != "object") return error(`As subschemas especificadas na chave <b>dependentSchemas</b> devem ser do tipo <i>object</i> (apenas), visto que são aplicadas a uma schema desse mesmo tipo!`)

        if (hasAll("required", obj)) {
          let subschema = obj.dependentSchemas[k].type.object
          if (obj.required.includes(k)) {
            if (hasAll("required", subschema)) obj.required = obj.required.concat(subschema.required.filter(x => !obj.required.includes(x)))
          }
        }
      }
    }
  }

  return true
}

// verificar a coerência do array de propriedades da chave 'required'
function checkRequiredProps(obj) {
  if (hasAll("required", obj)) {
    if (!obj.required.length) {delete obj.required; return true}

    if (obj.required.length != [...new Set(obj.required)].length) return error("Todos os elementos do array da chave <b>required</b> devem ser únicos!")
    
    let properties = hasAll("properties", obj) ? Object.keys(obj.properties) : []
    let patternProperties = hasAll("patternProperties", obj) ? Object.keys(obj.patternProperties).map(p => new RegExp(p)) : []

    for (let i = 0; i < obj.required.length; i++) {
      if (properties.includes(obj.required[i])) ;
      else if (patternProperties.some(p => p.test(obj.required[i]))) ;
      else if (!hasAny(["additionalProperties", "unevaluatedProperties"], obj)) ;
      else if (hasAll("additionalProperties", obj) && obj.additionalProperties !== false) ;
      else if (!hasAll("additionalProperties", obj) && hasAll("unevaluatedProperties", obj) && obj.unevaluatedProperties !== false) ;
      else return error(`A propriedade <i>${obj.required[i]}</i> referida na chave <b>required</b> não é permitida no objeto pela schema!`)
    }
  }
  return true
}

// verificar que as chaves 'required' e de tamanho do objeto não se contradizem
function checkMaxProperties(obj) {
  if (hasAll(["required", "maxProperties"], obj))
    if (obj.maxProperties < obj.required.length) return error(`A chave <b>maxProperties</b> define que o objeto deve ter, no máximo, ${obj.maxProperties} propriedades, contudo a chave <b>required</b> define que há ${obj.required.length} propriedades obrigatórias!`)

  if (hasAll("minProperties", obj)) {
    if (!hasAll("patternProperties", obj) && (
      (hasAll("additionalProperties", obj) && obj.additionalProperties === false) || 
      (!hasAll("additionalProperties", obj) && hasAll("unevaluatedProperties", obj) && obj.unevaluatedProperties === false))) {
        let properties = hasAll("properties", obj) ? Object.keys(obj.properties).length : 0
        if (properties < obj.minProperties) return error(`A chave <b>minProperties</b> define que o objeto deve ter, no mínimo, ${obj.minProperties} propriedades, contudo a schema permite um máximo de ${properties} propriedades no objeto!`)
    }
  }
  return true
}

// verificar a coerência das chaves de contenção 
function checkContains(obj) {
  if (!hasAll("contains", obj)) {
    if (hasAny(["minContains","maxContains"], obj)) return error("As chaves <b>minContains</b> e <b>maxContains</b> só podem ser usadas em conjunto com a chave <b>contains</b>!")
  }
  else if (hasAll(["minContains","maxContains"], obj) && obj.minContains > obj.maxContains) return error("O valor da chave <b>minContains</b> deve ser &#60;= ao da chave <b>maxContains</b>!")

  if (hasAll(["minContains", "maxItems"], obj) && obj.minContains > obj.maxItems) return error(`O array deve ter pelo menos ${obj.minContains} elementos, segundo a chave <b>minContains</b>, mas a chave <b>maxItems</b> define um limite máximo de ${obj.maxItems} elementos!`)

  return true
}

// verificar a coerência das chaves de comprimento de arrays
function checkArrayLength(obj) {
  if (hasAll(["minItems","maxItems"], obj) && obj.minItems > obj.maxItems) return error("O valor da chave <b>minItems</b> deve ser &#60;= ao da chave <b>maxItems</b>!")

  if (("items" in obj && obj.items === false) || (!hasAll("items", obj) && hasAll("unevaluatedItems", obj) && obj.unevaluatedItems === false)) {
    let prefixed = hasAll("prefixItems", obj) ? obj.prefixItems.length : 0
    if (hasAll("minItems", obj) && obj.minItems > prefixed) return error(`A chave <b>minItems</b> define que o array deve ter, no mínimo, ${obj.minItems} elementos, contudo a schema não permite mais de ${prefixed} elementos!`)
    if (hasAll("maxItems", obj) && obj.maxItems > prefixed) obj.maxItems = prefixed
  }

  if (hasAll(["prefixItems","minItems","items"], obj) && obj.items === false && obj.minItems > obj.prefixItems.length)
    return error(`A chave <b>minItems</b> define que o array deve ter, no mínimo, ${obj.minItems} elementos, contudo a chave <b>prefixItems</b> especifica apenas ${obj.prefixItems.length} elementos e a chave <b>items</b> proibe elementos extra para além desses!`)

  return true
}

// verificar que os elementos do array da chave 'enum' são todos únicos (não funciona para elementos array/objeto) e do tipo correto
function checkEnumArray(obj) {
  if (hasAll("enum", obj)) {
    if (!obj.enum.length) return error("O array da chave <b>enum</b> deve ter, no mínimo, um elemento!")
    if (obj.enum.length != [...new Set(obj.enum)].length) return error("Todos os elementos do array da chave <b>enum</b> devem ser únicos!")

    if (hasAll("type", obj) && obj.type.length > 0) {
      for (let i = 0; i < obj.enum.length; i++) {
        let valid = false

        for (let j = 0; j < obj.type.length; j++) {
          if (obj.type[j] == "array" && Array.isArray(obj.enum[i])) {valid = true; break}
          else if (obj.type[j] == "null" && obj.enum[i] === null) {valid = true; break}
          else if (obj.type[j] == "integer" && Number.isInteger(obj.enum[i])) {valid = true; break}
          else if (typeof obj.enum[i] == obj.type[j]) {valid = true; break}
        }

        if (!valid) return error(`Todos os elementos do array da chave <b>enum</b> devem ser do tipo {<b>${obj.type.join("</b>, <b>")}</b>}, segundo definido pela chave <b>type</b>!`)
      }
    }
  }
  return true
}

// verificar se o valor da chave 'const' e/ou 'default' é do tipo correto
function checkPredefinedValueType(obj) {
  let value = []
  if (hasAll("const", obj)) value.push({k: "const", v: obj.const[0]})
  if (hasAll("default", obj)) value.push({k: "default", v: obj.default[0]})

  if (value.length > 0 && obj.type.length > 0) {
    for (let i = 0; i < value.length; i++) {
      let valid = false

      for (let j = 0; j < obj.type.length; j++) {
        if (obj.type[j] == "array" && Array.isArray(value[i].v)) {valid = true; break}
        else if (obj.type[j] == "null" && value[i].v === null) {valid = true; break}
        else if (obj.type[j] == "integer" && Number.isInteger(value[i].v)) {valid = true; break}
        else if (typeof value[i].v == obj.type[j]) {valid = true; break}
      }

      if (!valid) return error(`O valor da chave <b>${value[i].k}</b> deve ser do tipo {<b>${obj.type.join("</b>, <b>")}</b>}, segundo definido pela chave <b>type</b>!`)
    }
  }
  return true
}

// verificar as condições if then else
function checkIfThenElse(obj) {
  if (hasAny(["if","then","else"], obj)) {
    if (!hasAll("if", obj)) return error("Não pode usar as chaves <b>then</b> e/ou <b>else</b> numa schema sem usar a chave <b>if</b>!")
    else if ("type" in obj.if) {
      let schema_types = obj.type.map(x => x=="integer" ? "number" : x)
      let if_types = Object.keys(obj.if.type)

      if (!schema_types.includes("undef") && schema_types.length > 0) {
        for (let i = 0; i < if_types.length; i++) {
          if (if_types[i] != "undef" && !schema_types.includes(if_types[i])) {
            delete obj.if.type[if_types[i]]
            if_types.splice(i--, 1)
          }
        }
      }

      if (hasAll("then", obj) && "type" in obj.then) {
        let then_types = Object.keys(obj.then.type)

        if (!if_types.includes("undef") && !then_types.includes("undef")) {
          if (!then_types.filter(t => if_types.includes(t)).length) return error("As schemas das chaves <b>if</b> e <b>then</b> devem ter pelo menos 1 tipo de dados gerável em comum!")

          for (let i = 0; i < then_types.length; i++) {
            if (!if_types.includes(then_types[i])) delete obj.then.type[then_types[i]]
          }
        }
      } 

      if (hasAll("else", obj) && "type" in obj.else) {
        let else_types = Object.keys(obj.else.type)

        if (!if_types.includes("undef") && !else_types.includes("undef")) {
          if (!else_types.filter(t => if_types.includes(t)).length) return error("As schemas das chaves <b>if</b> e <b>else</b> devem ter pelo menos 1 tipo de dados gerável em comum!")

          for (let i = 0; i < else_types.length; i++) {
            if (!if_types.includes(else_types[i])) delete obj.else.type[else_types[i]]
          }
        }
      }

      if (hasAll("if", obj) && !hasAny(["then","else"], obj)) delete obj.if
      if (hasAll("then", obj) && !hasAll("if", obj)) delete obj.then
      if (hasAll("else", obj) && !hasAll("if", obj)) delete obj.else
    }
  }
  return true
}

// verificar os requisitos necessários para se considerar a chave 'contentSchema'
function checkContentSchema(obj) {
  if (hasAll("contentSchema", obj) && !(hasAll(["type","contentMediaType"], obj) && obj.type.includes("string")))
    return error("O valor da chave <b>contentSchema</b> só é considerado se a instância for uma string e a chave <b>contentMediaType</b> estiver presente!")
  return true
}


module.exports = { checkSchema }