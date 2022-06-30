const RandExp = require('randexp');
const jsf = require('json-schema-faker');
const deepEqual = require('deep-equal');
const { structureUndefType } = require('./undefType')
const { extendSchema } = require('./schema_extender')

// instância original da estrutura intermédia que aqui chega, com schemas, subschemas e pn_refs
let original_json
let SETTINGS = {}

// tabs de indentação
const indent = depth => "\t".repeat(depth)
// schema que pode gerar qualquer tipo de valor
const trueSchema = {type: {string: {}, number: {}, boolean: {}, null: {}, array: {}, object: {}}}
// obter um número aleatório entre os limites
let randomize = (max,min) => Math.floor(Math.random() * ((max+1) - min) + min)
// obter um número aleatório entre 0 e len
let rand = len => Math.floor(Math.random()*len)
// clonar um valor
let clone = x => JSON.parse(JSON.stringify(x))

function convert(json, user_settings) {
    original_json = json
    SETTINGS = user_settings
    return "<!LANGUAGE pt>\n" + parseJSON(json.schema, 1, 1)
}

function parseJSON(json, depth, arr_offset) {
    // processar refs que tenham sido substítuidas dentro de chaves de composição de schemas
    if ("undef" in json.type) structureUndefType(json)

    let str = parseType(json, depth, arr_offset)
    if (depth==1 && str[0] != "{") str = "{\n" + indent(depth) + `DFJS_NOT_OBJECT: ${str}\n}`
    return str
}

// processa as chaves de composição de schemas pela ordem que aparecem no objeto
function parseAllSchemaComposition(json, type) {
    if (type == "array" && "contains" in json) arrayfyContains(json)
    let schemaComp_keys = Object.keys(json).filter(x => ["allOf","anyOf","oneOf","not","if"].includes(x))
    for (let i = 0; i < schemaComp_keys.length; i++) parseSchemaComposition(json, schemaComp_keys[i], type)
}

function parseSchemaComposition(json, key, type) {
    let subschemas = []
    if (key == "allOf") subschemas = json[key]
    if (key == "anyOf") subschemas = getRandomSubarray(json[key], randomize(json[key].length, 1))
    if (key == "oneOf") subschemas = [json[key][rand(json[key].length)]]
    if (key == "not") subschemas = [json[key]]
    if (key == "if") {
        if ("typeSchema" in json[key] || (!("booleanSchema" in json[key]) && Math.random() < SETTINGS.prob_if) || json[key].booleanSchema) { if ("then" in json) subschemas = [json[key], json.then] }
        else if ("else" in json) subschemas = [{not: json[key]}, json.else]

        if ("then" in json) delete json.then
        if ("else" in json) delete json.else
    }
    
    subschemas.map(s => parseAllSchemaComposition(s, type))
    subschemas.map(s => extendSchema(json, s, type, key, SETTINGS))
    delete json[key]
}

function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

function arrayfyContains(json) {
    let minContains = null, maxContains = null
    if ("minContains" in json) {minContains = json.minContains; delete json.minContains}
    if ("maxContains" in json) {maxContains = json.maxContains; delete json.maxContains}
    json.contains = [{contains: json.contains, minContains, maxContains}]
}

function parseType(json, depth, arr_offset) {
    let predefinedValue = arr => `gen => { return gen.random(...${JSON.stringify(arr)}) }`
    let possibleTypes = Object.keys(json.type)

    //selecionar um dos vários tipos possíveis aleatoriamente, para produzir
    let type = possibleTypes[rand(possibleTypes.length)]
    let value

    // resolver as chaves de composição de schemas aqui, para não ter de repetir este código na função de parsing de cada tipo
    parseAllSchemaComposition(json.type[type], type)
    parseNotPredefinedValues(json.type[type])

    if ("const" in json.type[type]) return predefinedValue(json.type[type].const)
    if ("enum" in json.type[type]) return predefinedValue(json.type[type].enum)
    if ("default" in json.type[type]) {
        let keys = Object.keys(json.type[type])
        if (keys.length == 1 || (type == "number" && keys.length == 2 && keys.includes("integer"))) return predefinedValue(json.type[type].default)
    }

    if (type == "object") value = parseObjectType(clone(json.type.object), false, depth)
    else {
        switch (type) {
            case "null": value = "null"; break
            case "boolean": value = "'{{boolean()}}'"; break
            case "string": value = parseStringType(json.type.string); break
            case "array": value = parseArrayType(json.type.array, depth + arr_offset); break
            case "number": value = parseNumericType(json.type.number, depth); break
        }

        if (depth==1) value = `{\n${indent(depth)}DFJS_NOT_OBJECT: ${value}\n}`
    }

    return value
}

function parseNotPredefinedValues(json) {
    if ("notValues" in json) {
        ["const","enum"].filter(k => k in json).map(k => {
            json[k] = json[k].filter(x => !json.notValues.some(y => deepEqual(x,y)))
            if (!json[k].length) delete json[k]
        })
    }

    if ("notDefault" in json && "default" in json) {
        json.default = json.default.filter(x => !json.notDefault.some(y => deepEqual(x,y)))
        if (!json.default.length) delete json.default
    }
}

// calcular o mínimo múltiplo comum de 2+ números
function lcm_n_numbers(arr) {
    let lcm = arr[0]
    for (let i = 1; i < arr.length; i++) lcm = lcm_two_numbers(lcm, arr[i])
    return lcm
}

// calcular o mínimo múltiplo comum entre 2 números
function lcm_two_numbers(x, y) {
  if ((typeof x !== 'number') || (typeof y !== 'number')) return false
  return (!x || !y) ? 0 : Math.abs((x * y) / gcd_two_numbers(x, y))
}

// calcular o maior divisor comum entre 2 números
function gcd_two_numbers(x, y) {
  x = Math.abs(x)
  y = Math.abs(y)
  while(y) {
    var t = y
    y = x % y
    x = t
  }
  return x;
}

function parseNumericType(json, depth) {
    let {multipleOf, notMultipleOf, minimum, maximum, exclusiveMinimum, exclusiveMaximum} = json
    let integer = "integer" in json && json.integer
    let notInteger = "integer" in json && !json.integer

    if (multipleOf === undefined) multipleOf = notInteger ? [0.4] : [1]
    else if (integer) multipleOf.push(1)

    let any_frac = multipleOf.reduce((a,c) => a || (c%1 != 0), false)
    let max = null, min = null
    let upper = null, lower = null

    if (maximum !== undefined) max = maximum
    if (exclusiveMaximum !== undefined) max = exclusiveMaximum - (any_frac ? 0.0000000001 : 1)

    if (minimum !== undefined) min = minimum
    if (exclusiveMinimum !== undefined) min = exclusiveMinimum + (any_frac ? 0.0000000001 : 1)

    // só acontece se o user fizer constraints inválidos com as chaves de composição de schemas
    if (min > max) max = null

    // mínimo múltiplo comum de todos os multipleOf
    let lcm = multipleOf.length == 1 ? multipleOf[0] : lcm_n_numbers(multipleOf)

    if (max !== null) upper = Math.floor(max/lcm)
    if (min !== null) lower = Math.ceil(min/lcm)
    if (upper !== null && lower === null) lower = upper - 100
    if (lower !== null && upper === null) upper = lower + 100

    // se não tiver quaisquer chaves de restrição, gera um inteiro/float aleatório
    if (!Object.keys(json).length || (Object.keys(json).length == 1 && "integer" in json)) return `'{{${integer ? "integer" : "float"}(-1000,1000)}}'`
    // se não tiver chaves de range, gera um múltiplo aleatório da chave 'multipleOf' ou, se não tiver, 1
    else if (upper === null) {
        if ("notMultipleOf" in json && "multipleOf" in json) return `gen => { //numeric
${indent(depth+1)}let multiples = gen.range(1,100).filter(i => ${JSON.stringify(notMultipleOf)}.every(notMult => ${lcm}*i % notMult != 0)).map(x => ${lcm}*x)
${indent(depth+1)}let notInteger = ${notInteger}, final_multiples = !multiples.length ? gen.range(1,100).map(x => ${lcm}*x) : multiples
${indent(depth+1)}if (notInteger && final_multiples.some(m => m%1 != 0)) final_multiples = final_multiples.filter(m => m%1 != 0)
${indent(depth+1)}return gen.random(...final_multiples)
${indent(depth)}}`
        else if ("notMultipleOf" in json) return `gen => { //numeric
${indent(depth+1)}for (let i = 0; i < 100; i++) {
${indent(depth+2)}let num = gen.${integer ? "integer" : "float"}(-1000, 1000)
${indent(depth+2)}if (${JSON.stringify(notMultipleOf)}.every(x => num%x != 0) || i==99) return num
${indent(depth+1)}}
${indent(depth)}}`
        else if (notInteger && lcm%1 != 0) return `gen => { //numeric
${indent(depth+1)}let multiples = gen.range(1,100).map(x => ${lcm}*x).filter(x => x%1 != 0)
${indent(depth+1)}return gen.random(...multiples)
${indent(depth)}}`
        return `'{{multipleOf(${lcm})}}'`
    }
    
    // se quiser um número entre certos limites, determina os múltiplos possíveis no intervalo de valores e gera um deles aleatoriamente
    if ("notMultipleOf" in json) return `gen => { //numeric
${indent(depth+1)}let multiples = ${lower < upper ? `gen.range(${lower},${upper+1})` : `[${lower}]`}.map(x => x*${lcm})
${indent(depth+1)}let final_multiples = multiples.filter(m => ${JSON.stringify(notMultipleOf)}.every(x => m%x != 0))
${indent(depth+1)}return !final_multiples.length ? gen.random(...multiples) : gen.random(...final_multiples)
${indent(depth)}}`
    return `gen => { return gen.integer(${lower},${upper}) * ${lcm} }`
}

function parseStringType(json) {
    if ("pattern" in json) return `'{{pattern("${json.pattern}")}}'`

    if ("notFormat" in json && "format" in json && json.notFormat.includes(json.format)) delete json.format
    if ("format" in json) {
        let minDate = {date: ["01/01/1950", "00:00:00"], neg: false}
        let defaultList = {max: 1, min: 1}
        
        switch (json.format) {
            case "date-time": return `'{{xsd_dateTime("dateTime",null,${JSON.stringify(minDate)},${JSON.stringify(defaultList)})}}'`
            case "date": return `'{{xsd_dateTime("date",null,${JSON.stringify(minDate)},${JSON.stringify(defaultList)})}}'`
            case "time": return `'{{time("hh:mm:ss", 24, false, "00:00:00", "23:59:59")}}'`
            case "duration": return `'{{xsd_duration("P","P1Y",${JSON.stringify(defaultList)})}}'`
            case "regex": return `'{{regex()}}'`

            case "email": case "idn-email":
                return `gen => { return gen.stringOfSize(5,20).replace(/[^a-zA-Z]/g, '').toLowerCase() + "@" + gen.random("gmail","yahoo","hotmail","outlook") + ".com" }`

            case "hostname": case "idn-hostname":
                return `gen => { return Array.apply(null, Array(gen.random(...gen.range(1,5)))).map(x => gen.stringOfSize(3,10).replace(/[^a-zA-Z]/g, '').toLowerCase()).join(".") }`

            case "ipv4": return `'{{pattern("^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$")}}'`
            case "ipv6": return `'{{pattern("^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)){3}))|:)))$")}}'`

            case "uuid": return "'{{guid()}}'"
            case "uri": case "iri": return `'{{pattern("https?:\\/\\/(www\\.)[-a-zA-Z0-9@:%._]{2,32}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_]{2,32})")}}'`
            case "uri-reference": case "iri-reference": return `'{{pattern("((https?:\\/\\/(www\\.))|\/)[-a-zA-Z0-9@:%._]{2,32}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_]{2,32})")}}'`
            case "uri-template": return `'{{pattern("https?:\\/\\/(www\\.)([-a-zA-Z0-9@:%._]{2,8}({[a-zA-Z]{3,10}})){1,5}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_]{2,32})")}}'`

            case "json-pointer": case "relative-json-pointer":
                let base_str = json.format == "json-pointer" ? "'https://datagen.di.uminho.pt" : "'"
                let ids = original_json.subschemas.map(x => x.id).filter(x => !/^anon/.test(x))

                let random_id = null
                if (ids.length > 0) random_id = ids[Math.floor(Math.random()*ids.length)]
                let schema = random_id === null ? original_json.schema : original_json.subschemas.filter(x => x.id == random_id)[0].schema
                
                let types_with_keys = Object.keys(schema.type).filter(t => Object.keys(schema.type[t]).length > 0)
                let type = types_with_keys[rand(types_with_keys.length)]
                
                if (random_id === null) return `'#/{{random("${Object.keys(schema.type[type]).join('","')}")}}'`
                return base_str + random_id + `/{{random("${Object.keys(schema.type[type]).join('","')}")}}'`
        }
    }

    let min = "minLength" in json ? json.minLength : 0
    let max = "maxLength" in json ? json.maxLength : min+100

    // só acontece se o user fizer constraints inválidos com as chaves de composição de schemas
    if (min > max) max = min+100
    return `'{{stringOfSize(${min}, ${max})}}'`
}

function parseObjectType(json, only_req, depth) {
    parseNotObjectKeys(json)

    let str = "{\n", obj = {}
    let required = "required" in json ? json.required.length : 0
    let {minProps, maxProps, size} = objectSize(json, required)
    let depSchemas = "dependentSchemas" in json ? json.dependentSchemas : {}
    let depSchemas_objects = []
    

    // gerar as propriedades required
    if (required > 0) addProperties(json, obj, json.required, depSchemas, depSchemas_objects, depth)
    if (only_req && Object.keys(obj).length >= minProps) return obj

    // adicionar uma propriedade nova ao objeto final
    let addProperty = (k,v) => obj[k] = parseJSON(v, depth+1, 0)
    
    // para verificar se é preciso fazer a propriedade recursiva ASAP ou se se pode fazer pela ordem natural
    let recursive_index = ("recursive" in json && json.recursive.key == "properties") ? (Object.keys(json.properties).findIndex(x => x == json.recursive.prop) + 1) : 0

    for (let i = required; i < size; ) {
        if (only_req && Object.keys(obj).length >= minProps) return obj

        if ("recursive" in json && json.recursive.key == "properties" && i + recursive_index > size) {
            if (!(json.recursive.prop in obj)) {
                addProperty(json.recursive.prop, json.properties[json.recursive.prop])
                delete json.properties[json.recursive.prop]
                i++
            }
            delete json.recursive
        }
        else if (depSchemas_objects.length > 0 && Math.random() > 0.5) {
            let schema_index = rand(depSchemas_objects.length)
            let props = Object.keys(depSchemas_objects[schema_index])
            let prop_index = rand(props.length)

            obj[props[prop_index]] = depSchemas_objects[schema_index][props[prop_index]]
            delete depSchemas_objects[schema_index][props[prop_index]]
            if (!Object.keys(depSchemas_objects[schema_index]).length) depSchemas_objects.splice(schema_index, 1)
        }
        else if ("properties" in json && Object.keys(json.properties).length > 0) {
            let k = Object.keys(json.properties)[0]

            if ("dependentRequired" in json && k in json.dependentRequired) {
                let new_required = [k].concat(json.dependentRequired[k].filter(x => !(x in obj)))

                for (let j = 1; j < new_required.length; j++) {
                    if (new_required[j] in json.dependentRequired) new_required = new_required.concat(json.dependentRequired[new_required[j]].filter(x => !(x in obj)))
                }

                let final_len = i + new_required.length
                if (final_len >= minProps && final_len <= maxProps) { addProperties(json, obj, new_required, depSchemas, depSchemas_objects, depth); break }
                else if (final_len < minProps) { addProperties(json, obj, new_required, depSchemas, depSchemas_objects, depth); i += new_required.length }
                else delete json.properties[k]
            }
            else {
                addProperty(k, json.properties[k])
                delete json.properties[k]
                i++

                if (k in depSchemas) {
                    let new_depSchemas_props = [k]

                    for (let j = 0; j < new_depSchemas_props.length; j++) {
                        let p = new_depSchemas_props[j]

                        let schema = parseObjectType(depSchemas[p].type.object, true, depth)
                        let new_required = "required" in depSchemas[p].type.object ? depSchemas[p].type.object.required : []
        
                        new_required.map(x => {
                            obj[x] = schema[x]
                            delete schema[x]
                            if (x in depSchemas) new_depSchemas_props.push(x)
                        })
                        
                        if (Object.keys(schema).length > 0) depSchemas_objects.push(schema)
                        i += new_required.length
                    }
                }
            }
        }
        // produzir, no máximo, 1 propriedade aleatória respeitante da schema da chave atual do patternProperties
        else if ("patternProperties" in json && Object.keys(json.patternProperties).length > 0) {
            let k = Object.keys(json.patternProperties)[0]
            let prop = new RandExp(k).gen()
            if (!(prop in obj) && Math.random() < SETTINGS.prob_patternProperty) { addProperty(prop, json.patternProperties[k]); i++ }
            delete json.patternProperties[k]
        }
        else if (!("additionalProperties" in json || "unevaluatedProperties" in json))
            { if (i < minProps || SETTINGS.random_props || "propertyNames" in json) nonRequired_randomProps(json, obj, size, trueSchema, addProperty); break }
        else if ("additionalProperties" in json && json.additionalProperties !== false)
            { nonRequired_randomProps(json, obj, size, json.additionalProperties, addProperty); break }
        else if (!("additionalProperties" in json) && "unevaluatedProperties" in json && json.unevaluatedProperties !== false) 
            { nonRequired_randomProps(json, obj, size, json.unevaluatedProperties, addProperty); break }
        else break
    }
    
    if (only_req && Object.keys(obj).length >= minProps) return obj

    // converter o objeto final para string da DSL
    Object.keys(obj).map(k => str += `${indent(depth)}${k}: ${obj[k]},\n`)

    if (str == "{\n") str = "{\n" + indent(depth) + "DFJS_EMPTY_JSON: true\n" + indent(depth-1) + "}"
    else str = `${str.slice(0, -2)}\n${indent(depth-1)}}`
    return str
}

function parseNotObjectKeys(json) {
    if ("required" in json && "notRequired" in json) {
        json.required = json.required.filter(x => !json.notRequired.includes(x))
        delete json.notRequired
    }
    if ("notAdditionalProperties" in json && "additionalProperties" in json && "type" in json.additionalProperties) {
        json.notAdditionalProperties.map(t => delete json.additionalProperties.type[t])
        delete json.notAdditionalProperties
        if (!Object.keys(json.additionalProperties.type).length) json.additionalProperties.type.null = {}
    }
    if ("notUnevaluatedProperties" in json && "unevaluatedProperties" in json && "type" in json.unevaluatedProperties) {
        json.notUnevaluatedProperties.map(t => delete json.unevaluatedProperties.type[t])
        delete json.notUnevaluatedProperties
        if (!Object.keys(json.unevaluatedProperties.type).length) json.unevaluatedProperties.type.null = {}
    }
}

// determinar um tamanho aleatório para o objeto a gerar, dentro dos limites estabelecidos
function objectSize(json, required) {
    let additional = ("additionalProperties" in json && json.additionalProperties !== false) || !("additionalProperties" in json) && "unevaluatedProperties" in json && json.unevaluatedProperties !== false
    let properties = "properties" in json ? Object.keys(json.properties).length : 0

    let minProps, maxProps
    if (!("minProperties" in json || "maxProperties" in json)) {
        minProps = "required" in json ? required : properties
        maxProps = (properties > required ? properties : required) + (additional ? 3 : 0)

        if (!required && !properties) {
            if ("patternProperties" in json) maxProps = Object.keys(json.patternProperties).length
            else if ("propertyNames" in json) maxProps = 3
            else if (!(!("additionalProperties" in json || "unevaluatedProperties" in json) || additional)) maxProps = 0
            else if (!("additionalProperties" in json)) {json.additionalProperties = trueSchema; maxProps = 3}
        }
        else if (SETTINGS.random_props && minProps == maxProps && minProps > 0 && (!("additionalProperties" in json || "unevaluatedProperties" in json))) maxProps += 3
        else if (!maxProps) maxProps = 3
    }
    else if ("minProperties" in json && !("maxProperties" in json)) {
        minProps = json.minProperties
        maxProps = properties > required ? properties : required
        if (!maxProps || maxProps < minProps) maxProps = minProps+3
        else if (additional) maxProps += 3
    }
    else if (!("minProperties" in json) && "maxProperties" in json) {
        maxProps = json.maxProperties
        minProps = required
    }
    else {
        minProps = json.minProperties
        maxProps = json.maxProperties
    }

    if ("recursive" in json) {
        if ("required" in json && json.recursive.key == "properties" && json.required.includes(json.recursive.prop)) ;
        else if ("maxProperties" in json) {
            if (json.maxProperties > required && minProps <= required) minProps = required + 1
        }
        else if (minProps <= required && (properties > required || (!("additionalProperties" in json || "unevaluatedProperties" in json) || additional))) minProps = required + 1
    }

    return {maxProps, minProps, size: randomize(maxProps, minProps)}
}

// adicionar um conjunto de propriedades ao objeto final
function addProperties(json, obj, props, depSchemas, depSchemas_objects, depth) {
    // adicionar uma propriedade nova
    let addProperty = (k,v) => obj[k] = parseJSON(v, depth+1, 0)
    
    for (let i = 0; i < props.length; i++) {
        let k = props[i]

        if (k in obj) ;
        else if ("properties" in json && k in json.properties) {
            addProperty(k, json.properties[k])
            delete json.properties[k]
            
            if (k in depSchemas) {
                let new_depSchemas_props = [k]

                for (let j = 0; j < new_depSchemas_props.length; j++) {
                    let p = new_depSchemas_props[j]

                    let schema = parseObjectType(depSchemas[p].type.object, true, depth)
                    let new_required = "required" in depSchemas[p].type.object ? depSchemas[p].type.object.required : []
    
                    new_required.map(x => {
                        obj[x] = schema[x]
                        delete schema[x]
                        if (x in depSchemas) new_depSchemas_props.push(x)
                    })
                    
                    if (Object.keys(schema).length > 0) depSchemas_objects.push(schema)
                }
            }
        }
        else if ("patternProperties" in json) {
            for (let j in json.patternProperties) {
                let regex = new RegExp(j)
                if (regex.test(k)) addProperty(k, json.patternProperties[j])
            }
        }
        else if ("additionalProperties" in json && json.additionalProperties !== false) addProperty(k, json.additionalProperties)
        else if (!("additionalProperties" in json) && "unevaluatedProperties" in json && json.unevaluatedProperties !== false) addProperty(k, json.unevaluatedProperties)
        else addProperty(k, trueSchema)
    }
}

// adicionar propriedades aleatórias ao objeto até ter o tamanho pretendido
function nonRequired_randomProps(json, obj, size, valueSchema, addProperty) {
    let randomNameTries = 0
    let namesSchema = {"minLength": 3, "maxLength": 10}

    if ("propertyNames" in json) {
        namesSchema = json.propertyNames.type.string
        parseAllSchemaComposition(namesSchema, "string")
        parseNotPredefinedValues(namesSchema)
    }
    namesSchema.type = "string"
    
    while (size > Object.keys(obj).length && randomNameTries < 10) {
        let key = jsf.generate(namesSchema)
        if (!("pattern" in namesSchema) && key.includes(" ")) key = key.replace(/ /g,'')

        if (!key.length || key.includes(" ") || key in obj) randomNameTries++
        else addProperty(key, clone(valueSchema))
    }
}

function parseArrayType(json, depth) {
    parseNotArrayKeys(json)

    let arr = []
    let prefixed = "prefixItems" in json ? json.prefixItems.length : 0
    let additionalItems = ("items" in json && json.items !== false) || !("items" in json) && "unevaluatedItems" in json && json.unevaluatedItems !== false
    let arrLen = arrayLen(json, prefixed, additionalItems)
    
    // gerar os elementos prefixados do array
    let prefixedLen = prefixed > arrLen.len ? arrLen.len : prefixed
    for (let i = 0; i < prefixedLen; i++) arr.push(parseJSON(json.prefixItems[i], depth, 0))

    // só gerar elementos do contains se forem permitidos itens extra
    if ("contains" in json && (!("items" in json || "unevaluatedItems" in json) || additionalItems)) {
        if (!("maxItems" in json) || prefixed < arrLen.maxItems) {
            if (prefixedLen < prefixed) {
                for (let i = prefixedLen; i < prefixed; i++) arr.push(parseJSON(json.prefixItems[i], depth, 0))
            }

            json.contains.map(c => {
                let containsSchema = c.contains
                let minContains = c.minContains !== null ? c.minContains : 1
                let maxContains = c.maxContains !== null ? c.maxContains : minContains
            
                let containsLen = randomize(maxContains, minContains)
                let sumLen = arr.length + containsLen
                let final_len = !("maxItems" in json) ? sumLen : (sumLen <= arrLen.maxItems ? sumLen : arrLen.maxItems)
    
                for (let i = arr.length; i < final_len; i++) arr.push(parseJSON(containsSchema, depth, 0))
            })
        }
    }

    // gerar os restantes elementos, se forem permitidos
    let nonPrefixedSchema = trueSchema
    if ("items" in json && json.items !== false) nonPrefixedSchema = json.items
    else if (additionalItems) nonPrefixedSchema = json.unevaluatedItems
    else if ("notContains" in json) nonPrefixedSchema = json.notContains

    if ("notContains" in json && (("items" in json && json.items !== false) || additionalItems)) {
        for (let t in json.notContains.type) {
            if (!(t in nonPrefixedSchema.type)) nonPrefixedSchema.type[t] = {}
            extendSchema(nonPrefixedSchema.type[t], json.notContains.type[t], t, null, SETTINGS)
        }
    }

    for (let i = arr.length; i < arrLen.len; i++) arr.push(parseJSON(nonPrefixedSchema, depth, 0))

    // converter o array final para string da DSL
    if (!("uniqueItems" in json && !arr.some(x => /^({\n|\[|gen => {( \/\/[^u])?\n)/.test(x)))) {
        let str = "[\n"
        arr.map((x,i) => {
            if (/^({\n|\[)/.test(x)) arr[i] = x.replace(/\n/g, "\n\t")
            str += `${indent(depth)}${arr[i]},\n`
        })
        return str == "[\n" ? "[]" : `${str.slice(0, -2)}\n${indent(depth-1)}]`
    }
    else {
        let convertItem = x => {
            if (x == "null") return x
            if (/^'(#\/|(https:\/\/datagen.di.uminho.pt)?\/json-schemas)/.test(x)) return x.replace(/{{/g, "' + gen.").replace(/}}/g, " + '")
            if (/^'{{/.test(x)) return "gen." + x.slice(3,-3)
            if (/^gen => { return/.test(x)) return x.split("return ")[1].slice(0,-2)
            if (/^gen => { \/\/numeric/.test(x)) return x.split("gen => { //numeric")[1].replace(/\n/g, "\n\t\t")
        }

        return `gen => { //uniqueItems
${indent(depth)}let arr = []
${indent(depth)}for (let i = 0; i < ${arr.length}; i++) {
${indent(depth+1)}for (let j = 0; j < 10; j++) {
${indent(depth+2)}let newItem
${arr.map((x,i) => {
    let str = "", multiline = /^gen => { \/\/numeric/.test(x)
    if (multiline) str += `${indent(depth+2)}let item${i} = () => {${convertItem(x)}\n`
    str += `${indent(depth+2)}if (i==${i}) newItem = ${!multiline ? convertItem(x) : `item${i}()`}\n`
    return str
}).join("")}${indent(depth+2)}if (!arr.includes(newItem) || j==9) {arr.push(newItem); break}
${indent(depth+1)}}\n${indent(depth)}}
${indent(depth)}return arr
${indent(depth-1)}}`
    }
}

function parseNotArrayKeys(json) {
    if ("notContains" in json || "notContainsTypes" in json) {
        let notContains = {type: {}}

        if ("notContains" in json) {
            json.notContains.map(s => {
                for (let t in s.type) {
                    if (!(t in notContains.type)) notContains.type[t] = {}
                    extendSchema(notContains.type[t], s.type[t], t, null, SETTINGS)
                }
            })
        }
        else notContains = trueSchema

        if ("notContainsTypes" in json) {
            json.notContainsTypes.map(t => delete notContains.type[t])
            delete json.notContainsTypes
        }

        if (!Object.keys(notContains.type).length) notContains.type.null = {}
        json.notContains = notContains
    }
    if ("notItems" in json && "items" in json && "type" in json.items) {
        json.notItems.map(t => delete json.items.type[t])
        delete json.notItems
        if (!Object.keys(json.items.type).length) json.items.type.null = {}
    }
    if ("notUnevaluatedItems" in json && "unevaluatedItems" in json && "type" in json.unevaluatedItems) {
        json.notUnevaluatedItems.map(t => delete json.unevaluatedItems.type[t])
        delete json.notUnevaluatedItems
        if (!Object.keys(json.unevaluatedItems.type).length) json.unevaluatedItems.type.null = {}
    }
}

// determinar um tamanho aleatório para o array a gerar, dentro dos limites estabelecidos
function arrayLen(json, prefixed, additionalItems) {
    let minItems, maxItems
    
    if (!("minItems" in json || "maxItems" in json)) {
        minItems = prefixed
        maxItems = minItems + (additionalItems ? 3 : 0)
        if (!prefixed && !("items" in json || "unevaluatedItems" in json)) maxItems = 3
    }
    else if ("minItems" in json && !("maxItems" in json)) {
        minItems = json.minItems
        maxItems = prefixed
        if (!prefixed || minItems > prefixed) maxItems = minItems+3
        else if (additionalItems) maxItems = prefixed+3
    }
    else if (!("minItems" in json) && "maxItems" in json) {
        maxItems = json.maxItems
        minItems = maxItems > prefixed ? prefixed : ("contains" in json ? maxItems : 0)
    }
    else {
        minItems = json.minItems
        maxItems = json.maxItems
    }

    if ("recursive" in json) {
        if ("maxItems" in json) {
            if (json.maxItems > 0 && minItems < json.recursive && maxItems >= json.recursive) minItems = json.recursive
        }
        else if (minItems < json.recursive && (prefixed >= json.recursive || additionalItems)) minItems = json.recursive
    }
    
    return {minItems, maxItems, len: randomize(maxItems, minItems)}
}

module.exports = { convert }