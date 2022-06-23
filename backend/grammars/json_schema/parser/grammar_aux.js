// separar as subschemas do all/any/oneOf por tipos de dados geráveis em subschemas mais pequenas, de forma a garantir que todos os elementos do all/any/oneOf podem gerar 1 único tipo de dados
// uma subschema só fica com um tipo se tiver chaves de algum dos tipos de dados primitivos
function checkCompositionTypes(key, value, error) {
  checkFalseSchema(key, value)
  // se for a chave 'allOf', determinar os tipos comuns a todas as suas schemas e apagar todas as subschemas que não forem desses tipos
  let allOf_types = key == "allOf" ? checkAllOfTypes(value, error) : null

  for (let i = 0; i < value.length; i++) {
    if ("type" in value[i]) {
      let types = Object.keys(value[i].type)

      if (types.length > 1) {
        let elem = value.splice(i--, 1)[0]

        for (let j = 0; j < types.length; j++) {
          // se tiver um all/any/oneOf aninhado dentro de uma chave igual, dar flat à estrutura
          if (key in elem.type[types[j]] && Object.keys(elem.type[types[j]]).length == 1) {
            elem.type[types[j]][key].map(x => {
              if (key != "allOf" || allOf_types.includes(types[j])) {
                let new_schema = {type: {}}
                new_schema.type[types[j]] = x
                value.push(new_schema)
              }
            })
          }
          else if (key != "allOf" || allOf_types.includes(types[j])) {
            let new_schema = {type: {}}
            new_schema.type[types[j]] = elem.type[types[j]]
            value.push(new_schema)
          }
        }
      }
      else if (key == "allOf" && !allOf_types.includes(types[0])) value.splice(i--, 1)
    }
  }
  return true
}

// verificar que todas as schemas da chave 'allOf' têm pelo menos um tipo de dados em comum
function checkAllOfTypes(value, error) {
  let types = []
  let types_map = value.map(x => {
    let keys = "type" in x ? Object.keys(x.type) : []
    keys.map(k => { if (!types.includes(k)) types.push(k) })
    if ("$ref" in x && !types.includes("undef")) types.push("undef")
    return keys
  })

  if (!types.includes("undef")) {
    for (let i = 0; i < types.length; i++) {
      if (types[i] != "undef" && !types_map.every(x => !x.length || x.includes(types[i]))) types.splice(i--, 1)
    }
  }

  if (!types.length) return error("As schemas da chave <b>allOf</b> devem ter pelo menos um tipo de dados em comum, caso contrário não é possível gerar um valor em conformidade com todas elas!")
  return types
}

// verificar que não há schemas false onde não deve
function checkFalseSchema(key, value, error) {
  if (Array.isArray(value)) {
    if (value.includes(false)) return error(`A chave <b>${key}</b> não pode conter uma subschema falsa!`)
  }
  else if (value === false) return error(`A schema da chave <b>${key}</b> não pode ser falsa!`)
  return true
}

// verificar que nenhuma das propriedades da chave 'dependentSchemas' tem uma schema boleana
function checkFalseProp(key, value, error) {
  for (let p in value) {
    if (key == "dependentSchemas") {
      if (typeof value[p] == "boolean") return error(`A chave <b>${key}</b> não pode ter uma propriedade associada a uma schema <i>true/false</i>!`)
    }
    else if (value[p] === false) return error(`A chave <b>${key}</b> não pode ter uma propriedade associada a uma schema falsa!`)
  }
  return true
}

// verificar que a schema dada pela chave 'propertyNames' é do tipo string
function checkPropertyNamesType(obj, error) {
  if (typeof obj === "boolean" || ("type" in obj && Object.keys(obj.type).some(k => k != "string")))
    return error(`Como as chaves de objetos devem ser sempre strings, está implícito que a schema dada pela chave <b>propertyNames</b> deve ser do tipo <b>string</b> (apenas)!`)
  return true
}


module.exports = {
  checkCompositionTypes,
  checkFalseSchema,
  checkFalseProp,
  checkPropertyNamesType
}