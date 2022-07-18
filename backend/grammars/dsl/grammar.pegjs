// DataGen Grammar
// ============

{
  //nomes de atributos reservados do Strapi
  var strapi_reserved = ['_id', 'id', 'length', 'attributes', 'relations', 'changed', 'created_by', 'updated_by', '_posts', '_pres', 'collection', 'emit', 'errors', 'get', 'init', 'isModified', 'isNew', 'listeners', 'modelName', 'on', 'once', 'populated', 'prototype', 'remove', 'removeListener', 'save', 'schema', 'toObject', 'validate']

  var language = "pt" //"pt" or "en", "pt" by default
  var components = {} //lista de componentes Strapi

  var collection_ids = {} //nomes das coleções e ids únicos respetivos
  var cur_collection = "" //nome da coleção atual durante a travessia

  var queue = [{value: 1, total: 1}] //queue com {argumento original do repeat, total de cópias que é necessário criar nesse repeat}
  var nr_copies = 1 //número de cópias de uma folha que é preciso produzir em qualquer momento
  
  var open_structs = 0 //para saber o nível de profundidade de estruturas em que está atualmente; incrementa ao abrir um objeto, array ou repeat
  var struct_types = [] //tipo das estruturas dentro das quais está, para saber se um index() pertence a um array ou a um repeat
  var array_indexes = [] //índices atuais onde se encontra dos arrays dentro dos quais está, para conseguir fazer o index() de um array

  var member_key = "" //chave do membro que está a processar no momento, para guardar na array abaixo ao começar um repeat
  var repeat_keys = [] //lista das chaves dos repeats, para ao fechar o objeto principal conseguir distinguir um objeto de um repeat (a data do objeto simples vem em Array(1))

  var unique = {moustaches: -1, count: 0, functions: []}

  var values_map = [] //estrutura de referenciação local a propriedades anteriores
  var invalid_local_arg = false //indica se a propriedade local que está a ser referenciada é inválida

  var errors = [] //lista de erros ligados à lógica das funcionalidades que não crasham a gramática

  function mapToString(arr) {
    return arr.map(x => Array.isArray(x) ? mapToString(x) : (typeof x == "object" ? JSON.stringify(x) : String(x)))
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function getPositionPairs(min, max) {
    var minArr = Array.isArray(min), maxArr = Array.isArray(max)

    if (!minArr && !maxArr) return [min, max]
    else {
      if (!minArr) min = Array(max.length).fill(min)
      if (!maxArr) max = Array(min.length).fill(max)
      
      var pairs = []
      for (let i = 0; i < min.length; i++) pairs.push([min[i], max[i]])
      return pairs
    }
  }

  function trimArg(arg, marks) {
    if (arg[0] == '"' || arg[0] == "'") {
      arg = arg.split(arg[0])[1].trim()
      return (marks ? `"${arg}"` : arg)
    }
    return arg
  }

  function getApiPath(key, args) {
    var path = ""
    var join = args.join(",")

    if (key in genAPI || ["xsd_gDay","xsd_gMonth","xsd_gYear","xsd_gMonthDay","xsd_gYearMonth","xsd_date"].includes(key)) {
      if (key == "index") {
        if (genAPI["index"](0, queue[queue.length-1], struct_types, array_indexes, 0) === false) errors.push({
          message: 'Não faz sentido invocar a função "index" aqui porque não está dentro de nenhum array!',
          location: location()
        })
        if (!join.length) join = "null"
        join += `, ${JSON.stringify(queue[queue.length-1])}, ${JSON.stringify(struct_types)}, ${JSON.stringify(array_indexes)}`
      }
      if (key == "letter") {
        if (!join.length) join = "null"
      }
      if (key == "float") {
        if (args.length == 2) join += ",null"
      }
      if (key == "formattedFloat") {
        var format = trimArg(args.slice(4, args.length).join(','), true)
        join = args.slice(0,4).join(',') + ',' + format
      }
      if (key == "position") {
        if (args.length == 1) join = "null,null"
      }
      if (key == "date") {
        if (args.length == 1) join += ",null,null"
        if (args.length == 2) join = (/\d/.test(args[1]) ? [args[0],args[1],"null"] : [args[0],"null",trimArg(args[1],true)]).join(",")
        if (args.length == 3) { args[2] = trimArg(args[2],true); join = args.join(",") }
      }
      if (key == "lorem") {
        args[0] = trimArg(args[0],true); join = args.join(",")
        if (args.length == 2) join += ",null"
      }
      if (key == "random") join = '[' + join + ']'
      if (key == "range") {
        if (args.length == 1) join += ",null,null"
        if (args.length == 2) join += ",null"
      }
      if (key == "time") {
        if (args.length == 3) join += ",null"
        if (args.length == 5) join = `${args[0]},${args[1]},${args[2]},{start: ${args[3]}, end: ${args[4]}}`
      }
      if (key == "language") {
        if (!args.length) join += ",null"
      }
      if (key == "stringOfSize" || key == "hexBinary") {
        if (args.length == 1) join += ",null"
      }
      if (key == "xsd_string") {
        if (args.length == 2) join += ",null"
      }
      if (key == "xsd_gDay") {
        if (args.length == 2) {
          args.map((x,i) => args[i] = parseInt(x.slice(4,-1)))
          join = args.join(",") + ',2,""'
        }
        else join = '1,31,2,""'
      }
      if (key == "xsd_gMonth") {
        if (args.length == 2) {
          args.map((x,i) => args[i] = parseInt(x.slice(3,-1)))
          join = args.join(",") + ',2,""'
        }
        else join = '1,12,2,""'
      }
      if (key == "xsd_gYear") {
        key = "formattedInteger"
        if (args.length == 2) {
          args.map((x,i) => args[i] = parseInt(x.slice(1,-1)))
          join = args.join(",") + ',4,""'
        }
        if (!join.length) join = '0,2020,4,""'
      }
      if (key == "xsd_gMonthDay") {
        args.map((arg,i) => args[i] = arg.slice(3,-1).split("-").map(x => parseInt(x)))
        args.map((arg,i) => args[i] = JSON.stringify({month: arg[0], day: arg[1]}))
        join = `"${key.slice(4)}",${args.join(",")}`
        key = "xsd_complexGType"
      }
      if (key == "xsd_gYearMonth") {
        args.map((arg,i) => args[i] = arg.slice(1,-1).split("-").map(x => parseInt(x)))
        args.map((arg,i) => args[i] = JSON.stringify({year: arg[0], month: arg[1]}))
        join = `"${key.slice(4)}",${args.join(",")}`
        key = "xsd_complexGType"
      }
      if (key == "xsd_duration") {
        args.map((arg,i) => args[i] = JSON.stringify(getDurationParts(arg.slice(1,-1))))
        join = args.join(",")
      }
      if (key == "xsd_dateTime") join = '"dateTime",' + join + (args.length == 1 ? ",null" : "")
      if (key == "xsd_date") {
        join = '"date",' + join + (args.length == 1 ? ",null" : "")
        key = "xsd_dateTime"
      }

      path = "genAPI." + key
      join += !join.length ? "gen.i" : ",gen.i"
      if (key == "random") join += ",-1"
    }
    else {
      if (key == "political_party") {
        if (args.length == 1) {
          var arg0 = !args[0].length ? "" : trimArg(args[0], false)
          if (["abbr","name"].includes(arg0)) { key += "_" + arg0; join = "" }
          else {
            key += (!args[0].length ? "" : "_from");
            join = trimArg(args[0], true)
          }
        }
        else {
          key += "_from_" + trimArg(args[1], false)
          join = trimArg(args[0], true)
        }
        path = "political_parties." + key
      }
      else if (['pt_district','pt_county','pt_parish','pt_city'].includes(key)) {
        if (args[0].length > 0) {
          var from = capitalize(trimArg(args[0], false))
          join = trimArg(args[1], true)

          if (key == "pt_district") key += "Of" + from
          if (key == "pt_county") key += (from == "District" ? "From" : "Of") + from
          if (key == "pt_parish") key += "From" + from
          if (key == "pt_city") key += "From" + from
        }
        path = "pt_districts." + key
      }
      else if (key == "pt_entity") {
        if (args[0].length > 0) {
          args[0] = trimArg(args[0], false)
          if (["abbr","name"].includes(args[0])) { key += "_" + args[0]; join = '"'+args[0]+'"' }
        }
        path = "pt_entities." + key
      }
      else if (key == "soccer_club") {
        path = "soccer_clubs." + key + (!args[0].length ? "" : "_from")
        if (args[0].length > 0 && !args[0].startsWith("this")) join = trimArg(args[0], true)
      }
      else if (['firstName','surname','fullName'].includes(key)) path = "names." + key
      else if (key[key.length-1] == 'y' && key != "day") path = `${key.slice(0,-1)+'ies'}.${key}`
      else if (key.slice(key.length-3) == "man") path = `${key.slice(0,-2)+'en'}.${key}`
      else path = `${key+'s'}.${key}`
      
      path = "dataAPI." + path
      join = `"${language}", gen.i, -1, ${join}`
    }

    return {path, args: join}
  }

  function getDurationParts(d) {
    let parts = []
    d = d.substring(1).split("T")
    if (d.length == 1) d.push("")

    let getParts = (chars, str) => {
      for (let i = 0; i < chars.length; i++) {
        if (!str.includes(chars[i])) {
          parts.push(0)
          if (chars[i] == "S") parts.push(0)
        }
        else {
          let split = str.split(chars[i])
          str = split[1]

          if (chars[i] == "S") {
            let s = split[0].split(".")
            if (s.length == 1) s.push("0")
            if (!s[0].length) s[0] = "0"
            s.map(x => parts.push(parseInt(x)))
          }
          else parts.push(parseInt(split[0]))
        }
      }
    }
    
    getParts(["Y","M","D"], d[0])
    getParts(["H","M","S"], d[1])
    return parts
  }

  function getLocalVars() {
    let local = Object.assign(..._.cloneDeep(values_map.map(x => x.data)))
    for (let prop in local) { if (!repeat_keys.includes(prop) && nr_copies == 1) local[prop] = local[prop][0] }
    return local
  }

  function checkLocalVar(key) {
    let local = Object.assign(..._.cloneDeep(values_map.map(x => x.data)))
    
    key = key.reduce((res, val, i) => res += (i==0 || val == "") ? val : (val[0] == '[' ? val : ('.'+val)), "")
    let keySplit = key.split(/(\[|\.)([^\[\.]+)/g), keys = []

    for (let i = 0; i < keySplit.length; i++) {
      if (keySplit[i] == '[') keys.push(keySplit[i] + keySplit[++i])
      else if (keySplit[i] == '.') keys.push(keySplit[++i])
      else if (keySplit[i] != "") keys.push(keySplit[i])
    }

    keys = keys.map(x => {
      if (x.match(/\["[^"]*"\]/)) return x.slice(2,-2)
      if (x.match(/\[[^\]]+\]/)) return parseInt(x.slice(1,-1))
      return x
    })

    for (let i = 0; i < keys.length; i++) {
      if (i == 1) local = local[0] //gen.i

      if (keys[i] in local) local = local[keys[i]]
      else {
        errors.push({
          message: `A propriedade '${key}' que está a tentar referenciar através do "this" nesta função não existe!`,
          location: location()
        })
        return false
      }
    }

    return true
  }

  function createComponent(name, value) {
    if ("component" in value) {
      if (open_structs > 1) {
        var id = cur_collection.substring(cur_collection.lastIndexOf('_'))
        var i = 1, filename = name + id

        var keys = Object.keys(components[cur_collection])
        while (keys.includes(filename)) filename = name + i++ + id

        value.model.collectionName = "components_" + filename
        value.model.info = {name}
        value.model.options = {}

        components[cur_collection][filename] = _.cloneDeep(value.model)
        value.model = { "type": "component", "repeatable": false, required: true, "component": cur_collection + '.' + filename }
      }

      delete value.component
    }
    return value
  }

  function getFunctionData(code) {
    let f = new Function("gen", code), data = []

    for (let i = 0; i < nr_copies; i++) {
      let local = getLocalVars()

      try { data.push(f({genAPI, dataAPI, local, i})) }
      catch(err) {
        errors.push({ message: "Tem algum erro nesta função!", location: location() })
        break
      }
    }
    
    return data
  }

  function replicateMapValues(num) {
    for (let i = 0; i < values_map.length; i++) {
      for (var prop in values_map[i].data) {
        let arr = []
        
        for (let j = 0; j < values_map[i].data[prop].length; j++) {
          let len = Array.isArray(num) ? num[j] : num
          for (let k = 0; k < len; k++) arr.push(values_map[i].data[prop][j])
        }
        if (arr.length) values_map[i].data[prop] = arr
      }
    }
  }

  function cleanMapValues(num) {
    for (let i = 0; i < values_map.length; i++) {
      for (var prop in values_map[i].data) {
        if (!("delete" in values_map[i].data[prop])) {
          let arr = [], ind_data = 0

          for (let j = 0; j < nr_copies; j++) {
            let step = Array.isArray(num) ? num[j] : num

            arr.push(values_map[i].data[prop][ind_data])
            ind_data += step
          }

          if (arr.length) values_map[i].data[prop] = arr
        }
      }
    }
  }

  function resolveMoustaches(api, sub_api, moustaches, args, i, sample) {
    if (moustaches == "random") return genAPI[moustaches](args, i, sample)
    if (api == "gen") return genAPI[moustaches](...args, i)
    if (api == "data") return dataAPI[sub_api][moustaches](language, i, sample, ...args)
  }

  function fillArray(api, sub_api, moustaches, args) {
    var arr = []
    if (unique.moustaches > -1) { unique.moustaches++; unique.functions.push(moustaches) }

    if (unique.moustaches == 1 && (moustaches == "random" || api == "data")) {
      let queue_last = queue[queue.length-1]
      
      for (let i = 0; i < queue_last.total/queue_last.value; i++) {
        var uniqArr = resolveMoustaches(api, sub_api, moustaches, args, i, queue_last.value)

        let len = uniqArr.length
        unique.count += len

        for (let j = len; j < queue_last.value; j++)
          uniqArr.push(resolveMoustaches(api, sub_api, moustaches, args, j, -1))

        arr = arr.concat(uniqArr)
      }
    }
    else {
      for (let i = 0; i < nr_copies; i++) {
        let val = resolveMoustaches(api, sub_api, moustaches, args, i, -1)

        if (moustaches == "index" && !Number.isInteger(val)) {
          errors.push({
            message: 'Não faz sentido invocar a função "index" aqui porque não está dentro de nenhum array!',
            location: location()
          })

          arr = Array(nr_copies).fill(0)
          break
        }
        else arr.push(val)
      }

      unique.count += nr_copies
    }

    return arr
  }

  function addCollectionModel(model, name, attributes) {
    model[name] = {
      kind: "collectionType",
      collectionName: name, info: {name},
      options: {}, attributes
    }
    return model
  }

  var chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size))

  var chunkDifferent = (arr, sizes) => {
    sizes = sizes.map((sum => value => sum += value)(0))
    sizes.unshift(0)
    
    var chunks = []
    for (var i = 0; i < sizes.length - 1; i++) chunks.push(arr.slice(sizes[i], sizes[i+1]))
    return chunks
  }
}

// ----- 2. DSL Grammar -----

DSL_text = language dataModel:collection_object { return {dataModel, components, collection_ids, errors, language} }

begin_array      = ws "[" ws { ++open_structs; struct_types.push("array"); array_indexes.push(0); values_map.push({type: "array", data: []}) }
begin_object     = ws "{" ws { ++open_structs; struct_types.push("object"); values_map.push({type: "object", data: {}}) }
end_array        = ws "]" ws { struct_types.pop(); array_indexes.pop() }
end_object       = ws "}" ws { --open_structs; struct_types.pop() }
name_separator   = ws ":" ws
repeat_separator = ws ":" ws { ++open_structs; struct_types.push("repeat") }
value_separator  = ws "," ws
date_separator   = ws sep:("/" / "-" / ".") ws { return sep }

ws "whitespace" = [ \t\n\r]*

language = ws "<!LANGUAGE " lang:("pt" / "en") ">" ws { language = lang }

// ----- 3. Values -----

value
  = directive
  / object
  / array
  / false
  / null
  / true
  / number
  / string
  / pattern

false = "false" { return {model: {type: "boolean", required: true}, data: Array(nr_copies).fill(false)} }
null  = "null"  { return {model: {type: "string", required: false, default: null}, data: Array(nr_copies).fill(null)} }
true  = "true"  { return {model: {type: "boolean", required: true}, data: Array(nr_copies).fill(true)} }

// ----- 4. Objects -----

collection_object
  = begin_object members:object_members end_object {
      var model = {}, data = {}

      for (let p in members) {
        if ("model" in members[p] && !("attributes" in members[p].model)) {
          data[p] = repeat_keys.includes(p) ? members[p].data : members[p].data[0]
          model[p] = members[p].model
        }
        else if ("or" in members[p]) {
          data[members[p].data[0].key] = members[p].data[0].value
          model = addCollectionModel(model, p+"_"+uuidv4(), members[p].model)
        }
        else if ("at_least" in members[p]) {
          for (let prop in members[p].model) {
            data[prop] = members[p].data[0][prop]
            model = addCollectionModel(model, prop+"_"+uuidv4(), members[p].model[prop])
          }
        }
        else if ("if" in members[p]) {
          for (let prop in members[p].data[0]) {
            data[prop] = members[p].data[0][prop]
            model = addCollectionModel(model, prop+"_"+uuidv4(), members[p].model[prop])
          }
        }
        else if ("probability" in members[p]) {
          for (let prop in members[p].model) {
            if (members[p].probability[0]) data[prop] = members[p].data[0][prop]
            model = addCollectionModel(model, prop+"_"+uuidv4(), members[p].model[prop])
          }
        }
        else if (!("temp" in members[p])) {
          model = addCollectionModel(model, collection_ids[p], members[p].model.attributes)
          data[p] = repeat_keys.includes(p) ? members[p].data : members[p].data[0]
        }
      }

      return members !== null ? {data, model} : {}
    }

object
  = begin_object members:object_members end_object {
    var data = [], model = {attributes: {}}
    for (let i = 0; i < nr_copies; i++) data.push({})

    for (let p in members) {
      if ("or" in members[p] || "at_least" in members[p] || "if" in members[p] || "probability" in members[p]) {
        for (let prop in members[p].model) model.attributes[prop] = members[p].model[prop]

        if ("or" in members[p]) {
          for (let i = 0; i < nr_copies; i++) data[i][members[p].data[i].key] = members[p].data[i].value
        }
        else if ("at_least" in members[p] || "if" in members[p]) {
          for (let i = 0; i < nr_copies; i++) {
            for (let prop in members[p].data[i]) data[i][prop] = members[p].data[i][prop]
          }
        }
        else {
          for (let prop in members[p].model) model.attributes[prop] = members[p].model[prop]
          for (let i = 0; i < nr_copies; i++) {
            if (members[p].probability[i]) {
              for (let prop in members[p].data[i]) data[i][prop] = members[p].data[i][prop]
            }
          }
        }
      }
      else if (!("temp" in members[p])) {
        model.attributes[p] = members[p].model
        for (let i = 0; i < nr_copies; i++) data[i][p] = members[p].data[i]
      }
    }
    
    values_map[values_map.length-1].delete = true
    return members !== null ? {data, model, component: true} : {}
  }

object_members
  = head:member tail:(value_separator m:member { return m })* {
    var result = {};
    [head].concat(tail).forEach(function(element) { result[element.name] = element.value })
    return result
  }

member
  = probability / function_prop / if / or / at_least / temp_var
  / name:member_key name_separator value:value_or_interpolation {
    if ("delete" in values_map[values_map.length-1]) values_map.pop()
    
    if ("repeat" in value) {
      values_map[values_map.length-1].data[name] = value.data.length == 1 ? value.data[0] : value.data
      delete value.repeat
    }
    else values_map[values_map.length-1].data[name] = value.data

    if (open_structs == 1) cur_collection = ""
    value = createComponent(name, value)
    return { name, value }
  }

value_or_interpolation = val:(value / interpolation / anon_function) {
    if (struct_types[struct_types.length-1] == "array") array_indexes[array_indexes.length-1]++

    if ("delete" in values_map[values_map.length-1] && values_map[values_map.length-2].type == "array") {
      let popped = values_map.pop()
      values_map[values_map.length-1].data.push(popped.data)
    }
    else if (!("delete" in values_map[values_map.length-1]) && values_map[values_map.length-1].type == "array") {
      values_map[values_map.length-1].data.push(val.data)
    }

    return val
  }

member_key = chars:(([$a-zA-Z_]/[^\x00-\x7F])([$a-zA-Z0-9_]/[^\x00-\x7F])*) {
    member_key = chars.flat().join("")

    if (strapi_reserved.includes(member_key)) errors.push({
      message: `${member_key} é uma chave reservada do Strapi! Por favor escolha outro nome para este atributo.`,
      location: location()
    })

    if (open_structs == 1) {
      cur_collection = member_key + "_" + uuidv4()
      collection_ids[member_key] = cur_collection
      components[cur_collection] = {}
    }
    return member_key
  }

// ----- 5. Arrays -----

array
  = begin_array
    arr:(
      head:value_or_interpolation
      tail:(value_separator v:value_or_interpolation { return v })*
      { return [head].concat(tail) }
    )?
    end_array func:functional?
    {
      var model = {attributes: {}}, data = []
      for (let i = 0; i < nr_copies; i++) data.push([])
      if (arr == null) arr = []

      for (let j = 0; j < arr.length; j++) {
        for (let k = 0; k < nr_copies; k++) data[k].push(arr[j].data[k])

        if (func == null) {
          arr[j] = createComponent("elem"+j, arr[j])
          model.attributes["elem"+j] = arr[j].model
        }
      }

      if (func != null) {
        model = {type: "json", required: true}
        var f = new Function("gen", "return gen.arr" + func)

        for (let i = 0; i < data.length; i++) {
          let local = getLocalVars()
          data[i] = f({genAPI, dataAPI, local, i, arr: data[i]})
        }
      }

      var dataModel = {data, model}
      if (--open_structs > 1 && func == null) dataModel.component = true
      
      values_map[values_map.length-1].delete = true
      return dataModel
    }

// ----- 6. Numbers -----

number "number"
  = minus? int frac? exp? {
    var num = parseFloat(text())
    return {model: {type: !(num%1) ? "integer" : "float", required: true}, data: Array(nr_copies).fill(num)}
  }

decimal_point
  = "."

digit1_9
  = [1-9]

e
  = [eE]

exp
  = e (minus / plus)? DIGIT+

frac
  = decimal_point DIGIT+

int
  = integer:((zero* i:(digit1_9 DIGIT*) {return i}) / (i:zero zero* {return i})) {
    return parseInt(Array.isArray(integer) ? integer.flat().join("") : integer)
  }

int_neg = minus? int { return parseInt(text()) }

minus
  = "-"

plus
  = "+"

zero
  = "0"

float_format
  = ws quotation_mark ws f:("0" int_sep:[^0-9"] "0" dec_sep:[^0-9"] "00" unit:[^0-9"]* { return text() }) ws quotation_mark ws { return f }

position
  = ws '[' ws min:number_or_local value_separator max:number_or_local ws ']' ws { return getPositionPairs(min,max) }

// ----- 7. Strings -----

string "string"
  = quotation_mark chars:char* quotation_mark {
    var str = chars.join("")
    return { model: {type: "string", required: true}, data: Array(nr_copies).fill(str) }
  }

simple_api_key
  = api:(districts_key / names_key / generic_key) "(" ws ")" {
    return {
      model: {type: "string", required: true}, 
      data: fillArray("data", api, text().split("(")[0], [])
    }
  }

districts_key = ("pt_district" / "pt_county" / "pt_parish" / "pt_city") { return "pt_districts" }
names_key = ("firstName" / "surname" / "fullName") { return "names" }
generic_key 
  = ("actor"
  / "animal"
  / "brand"
  / "buzzword"
  / "capital"
  / "car_brand"
  / "continent"
  / "cultural_center"
  / "hacker"
  / "job"
  / "month"
  / "musician"
  / "pt_politician"
  / "pt_public_figure"
  / "religion"
  / "soccer_player"
  / "sport"
  / "weekday"
  / "writer"
  ) { return text() + 's' }
  / ("country"
  / "gov_entity"
  / "nationality"
  / "top100_celebrity"
  / "pt_top100_celebrity"
  ) { return text().slice(0, -1) + 'ies' }
  / "pt_businessman" { return text().slice(0, -2) + 'en' }

nameOrAbbr
  = ws quotation_mark ws arg:(("name") / ("abbr")) ws quotation_mark ws { return arg }

string_arg
  = ws quotation_mark chars:[^"]* quotation_mark ws { return chars.flat().join("").trim() }

district_keyword = "pt_district" / "pt_county" / "pt_parish" / "pt_city" { return text() }

place_label
  = ws quotation_mark ws label:(("district") / ("distrito") / ("county") / ("concelho") / ("parish") / ("freguesia") / ("city") / ("cidade")) ws quotation_mark ws {
    if (label == "distrito") label = "district"
    if (label == "concelho") label = "county"
    if (label == "freguesia") label = "parish"
    if (label == "cidade") label = "city"

    return capitalize(label)
  }

lorem_string
  = quotation_mark ws word:(("word""s"?) / ("palavra""s"?)) ws quotation_mark { return "words" }
  / quotation_mark ws word:(("sentence""s"?) / ("frase""s"?)) ws quotation_mark { return "sentences" }
  / quotation_mark ws word:(("paragraph""s"?) / ("par"("a"/"á")"grafo""s"?)) ws quotation_mark { return "paragraphs" }

letter_case
  = quotation_mark ws word:(("uppercase") / ("mai"("ú"/"u")"scula")) ws quotation_mark { return "uppercase" }
  / quotation_mark ws word:(("lowercase") / ("min"("ú"/"u")"scula")) ws quotation_mark { return "lowercase" }

date = quotation_mark ws date:$(("0"[1-9]/[12][0-9]/"3"[01])("/"/"-"/".")("0"[1-9]/"1"[012])("/"/"-"/".")[0-9][0-9][0-9][0-9]) ws quotation_mark { return date.replace(/[^\d]/g, "/") }

xsd_date = quotation_mark ws date:$([0-9][0-9][0-9][0-9]"-"("0"[1-9]/"1"[012])"-"("0"[1-9]/[12][0-9]/"3"[01])) ws quotation_mark { return date }

xsd_dateTime = quotation_mark ws datetime:(date:$([0-9][0-9][0-9][0-9]"-"("0"[1-9]/"1"[012])"-"("0"[1-9]/[12][0-9]/"3"[01])) "T" time:$((([01][0-9]) / ("2"[0-3])) ":" [0-5][0-9] ":" [0-5][0-9])) ws quotation_mark { return datetime.join("") }

date_format
  = quotation_mark ws format:$("DD" date_separator "MM" date_separator ("AAAA" / "YYYY")) ws quotation_mark { return format }
  / quotation_mark ws format:$("MM" date_separator "DD" date_separator ("AAAA" / "YYYY")) ws quotation_mark { return format }
  / quotation_mark ws format:$(("AAAA" / "YYYY") date_separator "MM" date_separator "DD") ws quotation_mark { return format }

time_format
  = quotation_mark ws format:$("hh" (":" ("ss" / "mm" (":" "ss")?))?) ws quotation_mark { return format }
  / quotation_mark ws format:$("mm" (":" "ss")?) ws quotation_mark { return format }
  / quotation_mark ws format:"ss" ws quotation_mark { return format }

time = quotation_mark ws time:$((([01][0-9]) / ("2"[0-3])) ":" [0-5][0-9] ":" [0-5][0-9]) ws quotation_mark { return time }

pattern = quotation_mark pattern:$[^"]* quotation_mark { return {model: {type: "string", required: true}, data: Array(nr_copies).fill(pattern)} }

xsd_string_base = quotation_mark ws base:("ENTITY" / "Name" / "NCName" / "NMTOKEN" / "normalizedString" / "NOTATION" / "QName" / "string" / "token") ws quotation_mark { return base }

gYear = quotation_mark year:$("-"? DIGIT DIGIT DIGIT DIGIT DIGIT?) quotation_mark { return parseInt(year) }
gYearMonth = quotation_mark year:$("-"? DIGIT DIGIT DIGIT DIGIT DIGIT?) "-" month:$("0" digit1_9 / "1"[02]) quotation_mark { return {year: parseInt(year), month: parseInt(month)} }
gDay = quotation_mark "---" day:$("0" digit1_9 / [12] DIGIT / "3"[01]) quotation_mark { return parseInt(day) }
gMonth = quotation_mark "--" month:$("0" digit1_9 / "1"[0-2]) quotation_mark { return parseInt(month) }
gMonthDay = quotation_mark "--" month:$("0" digit1_9 / "1"[0-2]) "-" day:$("0" digit1_9 / [12] DIGIT / "3"[01]) quotation_mark { return {month: parseInt(month), day: parseInt(day)} }

duration = quotation_mark "-"? "P" Y:$(DIGIT+ "Y")? M:$(DIGIT+ "M")? D:$(DIGIT+ "D")? 
           T:("T" h:$(DIGIT+ "H")? m:$(DIGIT+ "M")? s:duration_seconds? {return [h,m].concat(s===null ? [0,0] : s)})? quotation_mark { return [Y,M,D].concat(T===null ? [0,0,0,0] : T).map(x => x==="" ? 0 : parseInt(x))}

duration_seconds = s:(s:(s:$DIGIT+ ss:$("." DIGIT+)? {return [s, ss.slice(1)]} / "." ss:$DIGIT+ {return [0, ss.slice(1)]}) "S" {return s})? {return s}

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape = "\\"

quotation_mark = '"'
apostrophe = "'"

unescaped
  = [^\0-\x1F\x22\x5C]

// ----- 8. Moustaches -----

natural_or_local = int / natural_local_arg
int_or_local = int_neg / int_local_arg
number_or_local = n:number {return n.data[0]} / num_local_arg
string_or_local = string_local_arg / string_arg
date_or_local = date / date_local_arg
time_or_local = time / time_local_arg
random_arg = v:(directive / object / array / false / true / number / string / moustaches_value) {return v.data} / local_arg

interpolation 
  = uniq_keyword "(" ws interp:interpolation_signature ws ")" {
    unique = {moustaches: -1, count: 0, functions: []}
    return interp
  }
  / interpolation_signature

uniq_keyword = "unique" { unique.moustaches = 0 }

interpolation_signature = apostrophe val:(moustaches / not_moustaches)* apostrophe str:(".string(" ws ")")? {
  var model = { type: "string", required: true }, data

  if (!val.length) data = Array(nr_copies).fill("")
  else if (unique.moustaches == 1 && unique.count < queue[queue.length-1].value) {
    let message

    if (unique.functions.includes("random")) message = 'A função "random" não tem argumentos suficientes para ser possível gerar um resultado diferente para cada elemento do "repeat" em que se encontra!'
    else message = 'O número de resultados distintos possíveis desta função de interpolação é inferior ao argumento do "repeat" onde se encontra! Deve ser igual ou superior.'

    errors.push({ message, location: location() })
  }
  else if (val.length == 1) {
    model = val[0].model; data = val[0].data
    data = !str ? val[0].data : mapToString(val[0].data)
  }
  else {
    val.forEach(obj => { if ("objectType" in obj && obj.objectType) obj.data = obj.data.map(el => JSON.stringify(el)) })
    data = val.reduce((a, o) => (a.push(o.data), a), []).reduce((a, b) => a.map((v, i) => v + b[i]))
  }

  return { model, data }
}

moustaches = moustaches_start ws v:moustaches_value ws moustaches_stop { return v }
           / moustaches_start v:local_arg moustaches_stop {return {data: v} }

not_moustaches = (!(moustaches_start / "'").)+ {
  return { model: {type: "string", required: true}, data: Array(nr_copies).fill(text()) }
}

moustaches_start = "{{"
moustaches_stop = "}}"

moustaches_value = gen_moustaches / api_moustaches

gen_moustaches
  = "objectId(" ws ")" { return { model: {type: "string", required: true}, data: fillArray("gen", null, "objectId", []) } }
  / "guid(" ws ")" { return { model: {type: "string", required: true}, data: fillArray("gen", null, "guid", []) } }
  / "boolean(" ws ")" { return { model: {type: "boolean", required: true}, data: fillArray("gen", null, "boolean", []) } }
  / "regex(" ws ")" { return { model: {type: "string", required: true}, data: fillArray("gen", null, "regex", []) } }
  / "index(" ws offset:(i:int_or_local ws { return i })? ")" {
      return {
        model: {type: "integer", required: true},
        data: fillArray("gen", null, "index", [offset, queue[queue.length-1], struct_types, array_indexes])
      }
    }
  / "letter(" ws letter_case:letter_case? ws ")" {
    return {
      model: { type: "string", required: true }, 
      data: fillArray("gen", null, "letter", [letter_case])
    }
  }
  / "integer(" ws min:int_or_local value_separator max:int_or_local ws ")" {
    return {
      model: { type: "integer", required: true }, 
      data: fillArray("gen", null, "integer", [min, max])
    }
  }
  / "integerOfSize(" ws size:int_or_local ws ")" {
    return {
      model: { type: "integer", required: true }, 
      data: fillArray("gen", null, "integerOfSize", [size])
    }
  }
  / "formattedInteger(" ws min:int_or_local value_separator max:int_or_local value_separator pad:natural_or_local value_separator quotation_mark unit:[^"]* quotation_mark ws ")" {
    return {
      model: { type: "string", required: true }, 
      data: fillArray("gen", null, "formattedInteger", [min, max, pad, unit.join("")])
    }
  }
  / "float(" ws min:number_or_local value_separator max:number_or_local decimals:(value_separator d:natural_or_local {return d})? ws ")" {
    return {
      model: { type: "float", required: true }, 
      data: fillArray("gen", null, "float", [min, max, decimals])
    }
  }
  / "formattedFloat(" ws min:number_or_local value_separator max:number_or_local value_separator decimals:natural_or_local value_separator pad:natural_or_local value_separator format:float_format ")" {
    return {
      model: { type: "string", required: true }, 
      data: fillArray("gen", null, "formattedFloat", [min, max, decimals, pad, format])
    }
  }
  / "position(" ws limits:(lat:(position/pair_local_arg) value_separator long:(position/pair_local_arg) {return {lat, long} })? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "position", [!limits ? null : limits.lat, !limits ? null : limits.long])
    }
  }
  / "pt_phone_number(" ws extension:("true" {return true} /"false" {return false})? ws ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "pt_phone_number", [extension])
    }
  }
  / "date(" ws start:date_or_local ws end:("," ws e:date_or_local ws { return e })? format:("," ws f:date_format ws { return f })? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "date", [start, end, format])
    }
  }
  / "time(" ws format:time_format value_separator range:("12"/"24") value_separator units:("true" {return true} /"false" {return false}) limits:(value_separator start:time_or_local value_separator end:time_or_local {return {start, end} })? ws ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "time", [format, range, units, limits])
    }
  }
  / "random(" ws values:(
      head:random_arg
      tail:(value_separator v:random_arg { return v })*
      { return [head].concat(tail) }
    ) ")" {
      return {
        model: {type: "json", required: true},
        data: fillArray("gen", null, "random", values)
      }
  }
  / "lorem(" ws units:lorem_string value_separator min:natural_or_local ws max:("," ws e:natural_or_local ws { return e })? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "lorem", [units, min, max])
    }
  }
  / "pattern(" ws pattern:string_or_local ws ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "pattern", [pattern])
    }
  }
  / "language(" ws arg:(len:natural_or_local ws {return len})? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "language", [arg])
    }
  }
  / "multipleOf(" ws num:number_or_local ws ")" {
    return {
      model: {type: "float", required: true},
      data: fillArray("gen", null, "multipleOf", [num])
    }
  }
  / "stringOfSize(" ws fst:int_or_local ws snd:("," ws max:int_or_local ws { return max })? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "stringOfSize", [fst, snd])
    }
  }
  / "xsd_string(" ws base:xsd_string_base ws "," ws min:natural_or_local ws max:("," ws trd:natural_or_local ws { return trd })? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "xsd_string", [base, min, max])
    }
  }
  / "hexBinary(" ws min:natural_or_local ws max:("," ws snd:natural_or_local ws { return snd })? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "hexBinary", [min, max])
    }
  }
  / "xsd_gDay(" ws args:(min:gDay ws "," ws max:gDay ws {return {min, max}})? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "formattedInteger", (args===null ? [1,31] : [args.min, args.max]).concat([2, ""])).map(x => "---" + x)
    }
  }
  / "xsd_gMonth(" ws args:(min:gMonth ws "," ws max:gMonth ws {return {min, max}})? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "formattedInteger", (args===null ? [1,12] : [args.min, args.max]).concat([2, ""])).map(x => "--" + x)
    }
  }
  / "xsd_gYear(" ws args:(min:gYear ws "," ws max:gYear ws {return {min, max}})? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "formattedInteger", (args===null ? [0,2020] : [args.min, args.max]).concat([4, ""]))
    }
  }
  / "xsd_gMonthDay(" ws min:gMonthDay ws "," ws max:gMonthDay ws ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "xsd_complexGType", ["gMonthDay", min, max])
    }
  }
  / "xsd_gYearMonth(" ws min:gYearMonth ws "," ws max:gYearMonth ws ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "xsd_complexGType", ["gYearMonth", min, max])
    }
  }
  / "xsd_duration(" ws min:duration ws "," ws max:duration ws ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "xsd_duration", [min, max])
    }
  }
  / "xsd_date(" ws min:xsd_date ws max:("," ws snd:xsd_date ws {return snd})? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "xsd_dateTime", ["date", min, max])
    }
  }
  / "xsd_dateTime(" ws min:xsd_dateTime ws max:("," ws snd:xsd_dateTime ws {return snd})? ")" {
    return {
      model: {type: "string", required: true},
      data: fillArray("gen", null, "xsd_dateTime", ["dateTime", min, max])
    }
  }

api_moustaches
  = simple_api_key
  / key:district_keyword "(" moustaches:place_label "," ws name:string_or_local ws ")" {
    let message = "", data = []

    if (key == "pt_district") {
      if (moustaches == "District") message = `Era esperado "city"/"cidade", "county"/"concelho" ou "parish"/"freguesia" mas foi encontrado "${moustaches.toLowerCase()}".`
      else moustaches = key + "Of" + moustaches
    }
    if (key == "pt_county") {
      if (["County","City"].includes(moustaches)) message = `Era esperado "district"/"distrito" ou "parish"/"freguesia" mas foi encontrado "${moustaches.toLowerCase()}".`
      else moustaches = key + (moustaches == "District" ? "From" : "Of") + moustaches
    }
    if (key == "pt_parish") {
      if (["Parish","City"].includes(moustaches)) message = `Era esperado "district"/"distrito" ou "county"/"concelho" mas foi encontrado "${moustaches.toLowerCase()}".`
      else moustaches = key + "From" + moustaches
    }
    if (key == "pt_city") {
      if (moustaches != "District") message = `Era esperado "district"/"distrito" mas foi encontrado "${moustaches.toLowerCase()}".`
      else moustaches = key + "From" + moustaches
    }

    if (message.length > 0) errors.push({ message, location: location() })
    else {
      data = fillArray("data", "pt_districts", moustaches, [name])
      if (data.some(i => i === false)) errors.push({
        message: `O nome do local que passou por argumento à função "${key}" não é válido!`,
        location: location()
      })
    }

    return { model: {type: "string", required: true}, data }
  }
  / key:("political_party" ("_name" / "_abbr")? {return text()}) "(" ws country:string_or_local? ws ")" {
    var moustaches = key + (country != null ? "_from" : "")
    var args = country != null ? [country] : []
    
    var value = {
      objectType: key == "political_party", model: {type: "string", required: true},
      data: fillArray("data", "political_parties", moustaches, args)
    }

    if (value.data.some(i => i === false)) errors.push({
      message: `O país que passou por argumento à função "${key}" não é válido!`,
      location: location()
    })

    if (key == "political_party") {
      value.model = { attributes: {
        party_abbr: {type: "string", required: true},
        party_name: {type: "string", required: true}
      } }
      
      value.component = true
      value = createComponent(key, value)
    }

    return value
  }
  / "soccer_club(" ws arg:string_or_local? ws ")" {
    var moustaches = !arg ? "soccer_club" : "soccer_club_from"
    var args = arg != null ? [arg] : []

    let data = fillArray("data", "soccer_clubs", moustaches, args)
    if (data.some(i => i === false)) errors.push({
      message: 'O país que passou por argumento à função "soccer_club" não é válido! Esta função só responde com clubes de Portugal, Espanha, Itália, Inglaterra e Alemanha.',
      location: location()
    })

    return { model: {type: "string", required: true}, data }
  }
  / key:("pt_entity" ("_name" / "_abbr")? {return text()}) "()" {
    var value = {
      objectType: key == "pt_entity", model: {type: "string", required: true},
      data: fillArray("data", "pt_entities", key, [])
    }

    if (key == "pt_entity") {
      value.model = { attributes: {
        abbr: {type: "string", required: true},
        name: {type: "string", required: true}
      } }
      
      value.component = true
      value = createComponent(key, value)
    }

    return value
  }


// ----- 9. Diretivas -----

directive
  = repeat
  / range

repeat
  = ws '[' ws num:repeat_signature ws repeat_separator ws val:value_or_interpolation ws ']' func:functional? ws {
    let queue_popped = queue.pop(); nr_copies = queue[queue.length-1].total
    struct_types.pop(); --open_structs
    
    var model = {attributes: {}}
    if (open_structs > 1) {
      val.data = Array.isArray(num) ? chunkDifferent(val.data, num) : chunk(val.data, num)

      if (func == null) {
        val = createComponent("elem", val)
        let min = !Array.isArray(num) ? num : (!num.length ? 0 : num.reduce((a,b) => { return Math.min(a,b) }))
        let max = !Array.isArray(num) ? num : (!num.length ? 0 : num.reduce((a,b) => { return Math.max(a,b) }))
        
        for (let i = 0; i < max; i++) {
          if (i >= min) val.model.required = false
          model.attributes["elem"+i] = val.model
        }
      }
    }

    if (func != null) {
      model = {type: "json", required: true}
      var f = new Function("gen", "return gen.arr" + func)
      
      for (let i = 0; i < (open_structs == 1 ? 1 : val.data.length); i++) {
        let local = getLocalVars()
        if (open_structs == 1) val.data = f({genAPI, dataAPI, local, i, arr: val.data})
        else val.data[i] = f({genAPI, dataAPI, local, i, arr: val.data[i]})
      }
    }

    cleanMapValues(queue_popped.value)
    return {data: val.data, model: open_structs > 1 ? model : val.model, repeat: true, component: true}
  }

repeat_signature 
  = "'" ws "repeat(" num:repeat_args  ")" ws "'" {
    nr_copies = Array.isArray(num) ? num.reduce((a,b) => a+b, 0) : nr_copies*num
    queue.push({ value: num, total: nr_copies })

    repeat_keys.push(member_key)
    replicateMapValues(num)
    return num
  }

repeat_args
  = ws min:natural_or_local ws max:("," ws m:natural_or_local ws { return m })? {
    var minArr = Array.isArray(min), maxArr = Array.isArray(max)

    if (max === null) {
      if ((minArr && min.some(i => i < 0)) || (!minArr && min < 0)) return Array(nr_copies).fill(0)
      if (min === 0) return Array(nr_copies).fill(0)
      return min
    }
    else if (!minArr && !maxArr) {
      if (min < 0 || max < 0) return Array(nr_copies).fill(0)

      let rand = []
      for (let i = 0; i < nr_copies; i++) rand.push(Math.floor(Math.random() * ((max+1) - min) + min))
      return rand
    }
    else {
      if (!minArr) min = Array(max.length).fill(min)
      if (!maxArr) max = Array(min.length).fill(max)

      if (min.some(i => i < 0) || max.some(i => i < 0)) return Array(nr_copies).fill(0)

      var nums = []
      for (let i = 0; i < min.length; i++) nums.push(Math.floor(Math.random() * ((max[i]+1) - min[i]) + min[i]))
      return nums
    }
  }

natural_local_arg = arg:local_arg {
    let arr = true
    if (!Array.isArray(arg)) { arg = [arg]; arr = false }

    if (invalid_local_arg) {
      invalid_local_arg = false
      return 0
    }
    else if (!(arg.every(i => i === 0) || arg.reduce((res, val) => { return res && Number.isInteger(val) }))) errors.push({
      message: 'A propriedade local que está a referenciar através do "this" não é um inteiro!',
      location: location()
    })
    else if (arg.some(i => i < 0)) errors.push({
      message: 'A propriedade local que está a referenciar através do "this" não pode ser um número negativo!',
      location: location()
    })

    if (!arr) arg = arg[0]
    return arg
  }

int_local_arg = arg:local_arg {
    let arr = true
    if (!Array.isArray(arg)) { arg = [arg]; arr = false }

    if (invalid_local_arg) {
      invalid_local_arg = false
      return 0
    }
    else if (!arg.reduce((res, val) => { return res && Number.isInteger(val) })) errors.push({
      message: 'A propriedade local que está a referenciar através do "this" não é um inteiro!',
      location: location()
    })

    if (!arr) arg = arg[0]
    return arg
  }

num_local_arg = arg:local_arg {
    let arr = true
    if (!Array.isArray(arg)) { arg = [arg]; arr = false }

    if (invalid_local_arg) {
      invalid_local_arg = false
      return 0
    }
    else if (!(arg.every(i => i === 0) || arg.reduce((res, val) => { return res && typeof val == 'number' }))) errors.push({
      message: 'A propriedade local que está a referenciar através do "this" não é um número!',
      location: location()
    })

    if (!arr) arg = arg[0]
    return arg
  }

pair_local_arg = arg:local_arg {
    let arr = true
    if (!Array.isArray(arg)) { arg = [arg]; arr = false }

    if (invalid_local_arg) {
      invalid_local_arg = false
      return [0,0]
    }
    else if (!(!arg.every(i => i === 0) && arg.reduce((res, val) => { return res && Array.isArray(val) && val.length == 2 && (val.every(i => i === 0) || (typeof val[0] == 'number' && typeof val[1] == 'number')) }))) {
      errors.push({
        message: 'A propriedade local que está a referenciar através do "this" não é uma posição válida!',
        location: location()
      })
      return [0,0]
    }

    if (!arr) arg = arg[0]
    return arg
  }

string_local_arg = arg:local_arg {
    let arr = true
    if (!Array.isArray(arg)) { arg = [arg]; arr = false }

    if (invalid_local_arg) {
      invalid_local_arg = false
      return ""
    }
    else if (!arg.reduce((res, val) => { return res && typeof val == 'string' })) errors.push({
      message: 'A propriedade local que está a referenciar através do "this" não é uma string!',
      location: location()
    })

    if (!arr) arg = arg[0]
    return arg
  }

date_local_arg = arg:local_arg {
    let arr = true
    if (!Array.isArray(arg)) { arg = [arg]; arr = false }

    if (invalid_local_arg) { invalid_local_arg = false; return "01/01/1950" }
    else {
      var match = arg.every(val => /(((((0[1-9]|1[0-9]|2[0-8])[./-](0[1-9]|1[012]))|((29|30|31)[./-](0[13578]|1[02]))|((29|30)[./-](0[4,6,9]|11)))[./-](19|[2-9][0-9])[0-9][0-9])|(29[./-]02[./-](19|[2-9][0-9])(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96)))/.test(val))
    
      if (match) {
        return !arr ? arg[0].replace(/[^\d]/g, "/") : arg.map(x => x.replace(/[^\d]/g, "/"))
      }
      else {
        errors.push({
          message: 'A propriedade local que está a referenciar através do "this" não é uma data válida!',
          location: location()
        })
        return "01/01/1950"
      }
    }
  }

time_local_arg = arg:local_arg {
    let arr = true
    if (!Array.isArray(arg)) { arg = [arg]; arr = false }

    if (invalid_local_arg) { invalid_local_arg = false; return "00:00:00" }
    else {
      var match = arg.every((val, i, arr) => /([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/.test(val))
    
      if (match) {
        if (!arr) arg = arg[0]
        return arg
      }
      else {
        errors.push({
          message: 'A propriedade local que está a referenciar através do "this" não é uma hora válida!',
          location: location()
        })
        return "00:00:00"
      }
    }
  }

local_arg = ws "this" char:("."/"[") key:code_key ws {
    if (char == "[") key = char + key

    let local = getLocalVars()
    let args = key.match(/([$a-zA-Z_"]|[^\x00-\x7F])([$a-zA-Z0-9_"\[\]]|[^\x00-\x7F])*/g)

    for (let i = 0; i < args.length; i++) {
      if (args[i] in local) local = local[args[i]]
      else {
        errors.push({
          message: `A propriedade ${key} que está a referenciar através do "this" não existe!`,
          location: location()
        })

        invalid_local_arg = true
        break
      }
    }
    
    return local
  }

range
  = "range(" ws data:range_args ws ")" func:functional? {
    var dataModel = (open_structs > 1 && func == null) ? {component: true} : {}
    var model = {attributes: {}}
    for (let i = 0; i < data[0].length; i++) model.attributes["elem"+i] = {type: "integer", required: true}

    if (func != null) {
      model = {type: "json", required: true}
      var f = new Function("gen", "return gen.arr" + func)

      for (let i = 0; i < data.length; i++) {
        let local = getLocalVars()
        data[i] = f({genAPI, dataAPI, local, i, arr: data[i]})
      }
    }

    dataModel.data = data
    dataModel.model = model
    return dataModel
  }

range_args
  = init:int_or_local args:(value_separator end:int_or_local step:(value_separator s:int_or_local { return s })? { return {end, step}})? {
    var end = !args ? null : args.end
    var step = (!args || args.step == null) ? null : args.step
    let range = fillArray("gen", null, "range", [init, end, step])

    if (range.some(i => i == false)) {
      errors.push({
        message: 'Este "range" entra em ciclo infinito!',
        location: location()
      })
      for (let i = 0; i < range.length; i++) range[i] = []
    }
    return range
  }

functional = ws (mapFilter / reduce) functional? { return text() }

mapFilter
  = "." ("map"/"filter") "(" ws "function(" mapFilter_args ")" ws function_code ws ")" { return text() }
  / "." ("map"/"filter") "(" mapFilter_anon_args "=>" ws function_code ws ")" { return text() }

mapFilter_args = ws code_key (value_separator code_key (value_separator code_key)?)? ws { return text() }

mapFilter_anon_args
  = ws code_key ws { return text() }
  / ws "(" mapFilter_args ")" ws { return text() }

reduce
  = ".reduce(" ws "function" reduce_args function_code ws ")" { return text() }
  / ".reduce(" ws reduce_args "=>" ws function_code ws ")" { return text() }

reduce_args = "(" ws code_key value_separator code_key (value_separator code_key (value_separator code_key)?)? ws ")" ws { return text() }

probability
  = sign:("missing" / "having" {return text()}) "(" ws probability:("0"*("1""0""0"/[1-9][0-9]?)?) ws ")" ws obj:object {
    var prob = parseInt(probability.flat().join(""))/100, data = [], probArr = []
    values_map.pop()
    
    for (let p in obj.model.attributes) {
      obj.model.attributes[p].required = false
      values_map[values_map.length-1].data[p] = []
    }

    for (let i = 0; i < nr_copies; i++) {
      probArr.push((sign == "missing" && Math.random() > prob) || (sign == "having" && Math.random() < prob))
      data.push(probArr[i] ? obj.data[i] : null)

      let nullKeys = Object.keys(obj.model.attributes)
      for (let p in obj.data[i]) {
        values_map[values_map.length-1].data[p].push(probArr[i] ? obj.data[i][p] : null)
        nullKeys.splice(nullKeys.indexOf(p), 1)
      }

      nullKeys.forEach(k => values_map[values_map.length-1].data[k].push(null))
    }

    return {
      name: uuidv4(),
      value: { probability: probArr, model: obj.model.attributes, data }
    }
  }

temp_var = "local_variables(" ws ")" ws obj:object {
    values_map.pop()

    for (let prop in obj.model.attributes) {
      values_map[values_map.length-1].data[prop] = []
    }

    for (let i = 0; i < nr_copies; i++) {
      for (let key in obj.data[i]) {
        values_map[values_map.length-1].data[key].push(obj.data[i][key])
      }
    }

    return { name: uuidv4(), value: { temp: true } }
  }

or = "or(" ws ")" ws obj:object {
    var model = {}, data = []
    values_map.pop()

    for (let prop in obj.model.attributes) {
      obj.model.attributes[prop].required = false
      model[prop] = obj.model.attributes[prop]
      values_map[values_map.length-1].data[prop] = []
    }

    for (let i = 0; i < nr_copies; i++) {
      let keys = Object.keys(obj.data[i])
      let key = keys[Math.floor(Math.random() * (0 - keys.length) + keys.length)]

      data.push({key, value: obj.data[i][key]})
      values_map[values_map.length-1].data[key].push(obj.data[i][key])

      let nullKeys = Object.keys(model)
      nullKeys.splice(nullKeys.indexOf(key), 1)
      nullKeys.forEach(k => values_map[values_map.length-1].data[k].push(null))
    }

    return { name: uuidv4(), value: { or: true, model, data } }
  }

at_least = "at_least(" ws num:natural_or_local ws ")" obj:object {
    var model = {}, data = []
    if (!Array.isArray(num)) num = Array(nr_copies).fill(num)
    values_map.pop()
    
    if (num.every(i => i >= 0)) {
      for (let prop in obj.model.attributes) {
        obj.model.attributes[prop].required = false
        model[prop] = obj.model.attributes[prop]
        values_map[values_map.length-1].data[prop] = []
      }

      for (let i = 0; i < nr_copies; i++) {
        let keys = Object.keys(obj.data[i])
        let nullKeys = Object.keys(model)

        var n = Math.floor(Math.random() * ((keys.length+1) - num[i]) + num[i])
        if (num[i] > keys.length) n = keys.length
        data.push({})

        for (let j = 0; j < n; j++) {
          let key = keys[Math.floor(Math.random() * (0 - keys.length) + keys.length)]
          data[i][key] = obj.data[i][key]
          values_map[values_map.length-1].data[key].push(obj.data[i][key])
          
          keys.splice(keys.indexOf(key), 1)
          nullKeys.splice(nullKeys.indexOf(key), 1)
        }

        nullKeys.forEach(k => values_map[values_map.length-1].data[k].push(null))
      }
    }
    
    return { name: uuidv4(), value: { at_least: true, model, data }}
  }

if = 
  conds:(
    head:("if" ws if_cond:if_code if_obj:object {return {if: if_cond, obj: if_obj}})
    tail:("else" ws "if" ws eif_cond:if_code eif_obj:object {return {if: eif_cond, obj: eif_obj}})*
    { return [head].concat(tail) }
  ) else_obj:("else" o:object {return {if: true, obj: o}})? 
  {
    var model = {}, data = []
    if (else_obj != null) conds.push(else_obj)

    for (let i = 0; i < conds.length; i++) values_map.pop()
    
    conds.forEach(x => {
      x.if = new Function("gen", "return " + x.if)

      for (let prop in x.obj.model.attributes) {
        x.obj.model.attributes[prop].required = false
        model[prop] = x.obj.model.attributes[prop]
        values_map[values_map.length-1].data[prop] = []
      }
    })

    for (let i = 0; i < nr_copies; i++) {
      let local = getLocalVars()
      let found = false, data_keys = []
      data.push({})

      for (let j = 0; j < conds.length; j++) {
        if (!found && conds[j].if({genAPI, dataAPI, local, i})) {
          data_keys = data_keys.concat(Object.keys(conds[j].obj.data[i]))
          found = true

          for (let prop in conds[j].obj.data[i]) {
            data[i][prop] = conds[j].obj.data[i][prop]
            values_map[values_map.length-1].data[prop].push(conds[j].obj.data[i][prop])
          }
        }
        else {
          data_keys = data_keys.concat(Object.keys(conds[j].obj.data[i]))
          for (let prop in conds[j].obj.data[i]) values_map[values_map.length-1].data[prop].push(null)
        }
      }
      
      var null_keys = Object.keys(model).filter(x => !data_keys.includes(x))
      null_keys.forEach(k => values_map[values_map.length-1].data[k].push(null))
    }

    return { name: uuidv4(), value: { if: true, model, data } }
  }

function_prop
  = name:function_key "(" ws "gen" ws ")" ws code:function_code {
    var data = getFunctionData(code)
    values_map[values_map.length-1].data[name] = data
    return { name, value: { model: {type: "json", required: true}, data } }
  }

anon_function = "gen" ws "=>" ws code:function_code {
    return { model: {type: "json", required: true}, data: getFunctionData(code) }
  }
  
function_key = chars:(([a-zA-Z_]/[^\x00-\x7F])([a-zA-Z0-9_]/[^\x00-\x7F])*) { return chars.flat().join("") }

function_code = CODE_START str:(gen_call / local_var / not_code / function_code)* CODE_STOP { return "\x7B" + str.join("") + "\x7D" }

if_code = ARGS_START str:(gen_call / local_var / not_parentheses / if_code)* ARGS_STOP { return "(" + str.join("") + ")" }

not_code = !CODE_START !CODE_STOP. { return text() }

code_key = key:((key_property / [a-zA-Z_"]/[^\x00-\x7F]) (key_property / ([a-zA-Z0-9_\.]/[^\x00-\x7F]))*) { return key.flat().join("") }

local_var_code_key = key:((key_property / [a-zA-Z_"]/[^\x00-\x7F]) (key_property / ([a-zA-Z0-9_\.(]/[^\x00-\x7F]))*) { return key.flat().join("") }

key_property = PROP_START str:(([a-zA-Z0-9_"]/[^\x00-\x7F])+) PROP_STOP { return text() }

local_var = "this" char:"."? key:local_var_code_key {
    let keySplit

    if (char == null) {
      keySplit = key.split(/\](.+)/)
      keySplit[0] += ']'
    }
    else {
      keySplit = key.split(/(\[|\.)(.+)/)

      if (keySplit[1] == '.') keySplit = [keySplit[0], keySplit[2]]
      if (keySplit[1] == '[') keySplit = [keySplit[0], '[' + keySplit[2]]
    }
      
    var path = `gen.local${char=="."?".":""}${keySplit[0]}${nr_copies>1?"[gen.i]":""}`
    if (keySplit.length > 1) path += ((keySplit[1][0] != "[" && keySplit[1][0] != ".") ? "." : "") + keySplit[1]
    if (keySplit[keySplit.length-1].includes("(")) keySplit.pop()

    checkLocalVar(keySplit)
    return path
  }

gen_call = "gen.pattern(" ws quotation_mark arg:$[^"]+ quotation_mark ws ")" { return `gen.genAPI.pattern("${arg}")` }
         / "gen." key:code_key ARGS_START args:(gen_call / local_var / not_parentheses)* ARGS_STOP {
    args = args.join("").split(",")
    
    var split = [], build = "", i = 0
    while (i < args.length) {
      if (!args[i].includes('(')) split.push(args[i++])
      else {
        build = ""
        while (!args[i].includes(')')) build += args[i++] + ','
        split.push(build + args[i++])
      }
    }

    var obj = getApiPath(key, split.map(x => x.trim()))
    if (obj.path.startsWith("genAPI.xsd_gDay")) return `"---" + gen.${obj.path.replace("xsd_gDay", "formattedInteger")}(${obj.args})`
    if (obj.path.startsWith("genAPI.xsd_gMonth")) return `"--" + gen.${obj.path.replace("xsd_gMonth", "formattedInteger")}(${obj.args})`
    return `gen.${obj.path}(${obj.args})`
  }

not_parentheses = !ARGS_START !ARGS_STOP. { return text() }

ARGS_START = "("
ARGS_STOP = ")"

CODE_START = "{"
CODE_STOP = "}"

PROP_START = "["
PROP_STOP = "]"

// ----- Core ABNF Rules -----

// See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i