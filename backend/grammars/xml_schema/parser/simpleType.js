// Funções auxiliares ----------

// retornar erro
const error = msg => {return {error: msg}}
// retorna dados encapsulados, se não houver nenhum erro
const data = x => {return {data: x}}
// contar o número de dígitos significativos num número
let countDigits = num => String(num).replace(/\-|\./g, "").length
// contar o número de dígitos da parte inteira de um número
let countIntDigits = num => String(num).replace(/\-|\.\d+/g, "").length
// contar o número de dígitos fracionários de um número
let countFracDigits = num => num%1 === 0 ? 0 : String(num).replace(/\-?\d*\./, "").length
// verificar se o tipo-base é um tipo de números inteiros
let isBaseInt = base => ["byte","int","integer","long","short","negativeInteger","nonNegativeInteger","nonPositiveInteger","positiveInteger"].includes(base) || base.startsWith("unsigned")
// verifica se o tipo-base é um tipo-lista
let isListType = base => ["list","ENTITIES","IDREFS","NMTOKENS"].includes(base)
// retorna o comprimento de uma enumeração, conforme seja uma string ou uma lista
let enumLength = (e, base) => isListType(base) ? e.split(/[ \t\n\r]+/g).length : e.length
// verificar se é um objeto
let isObject = x => typeof x === 'object' && !Array.isArray(x) && x !== null

// criar array com os nomes do tipos embutidos da XML Schema
const built_in_types = simpleTypes => {
  return Object.keys(simpleTypes).filter(p => "XMLSchema" in simpleTypes[p])
}

// verificar se 2 strings são adjacentes em termos ASCII
function adjacentASCII(str1, str2) {
    let len1 = str1.length, len2 = str2.length
    
    for (let i = 0; i < Math.max(len1, len2); i++) {
      if (i == len1 || i == len2) return false
    
      let dif = Math.abs(str1[i].charCodeAt(0) - str2[i].charCodeAt(0))
      if (dif != 0) {
        if (dif == 1 && i == len1-1 && i == len2-1) return true
        return false
      }
    }
}
  
// calcular o número de milisegundos correspondente a uma duration
function durationToMS(d) {
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

    let ms = 0, scale = 1, ratio = [12, 30, 24, 60, 60, 1000, 1]
    for (let i = parts.length-1; i >= 0; i--) {
      scale *= ratio[i]
      ms += parts[i] * scale
    }
    return ms
}

// verificar que o tipo local que está a ser referenciado existe
function validate_TypeRef(ref, curr, existsLocalType, default_prefix, simpleTypes) {
  let error_msg = {
    BSC: "tipo embutido, simpleType ou complexType",
    BS: "tipo embutido ou simpleType",
    C: "complexType"
  }

  let type = ref[ref.length-1]
  let prefix = ref.length == 2 ? ref[0] : null

  if (curr.any_type != "C" && built_in_types(simpleTypes).includes(type)) {
    return prefix === default_prefix ? data(true) : error(`Para especificar um dos tipos embutidos de schemas XML, tem de o prefixar com o prefixo do namespace desta schema.
                                                    ${(default_prefix === null && prefix !== null) ? " Neste caso, como não declarou um prefixo para o namespace da schema, não deve prefixar o tipo também." : ""}`)
  }
  if (prefix == null || prefix == default_prefix) {
    if (!existsLocalType) return error(`Tem de referenciar um ${error_msg[curr.any_type]} válido!`)
    if (!curr.curr && type === curr.type) return error(`Definições circulares detetadas para o tipo <b>${type}</b>! Isto significa que o <b>${type}</b> está contido na sua própria hierarquia, o que é um erro.`)
  }
  return data(true)
}

// determinar o nome e prefixo de schema do tipo em questão e o nome da sua base embutida
/* operacional apenas para tipos da schema local */
function getTypeInfo(type, default_prefix, simpleTypes) {
  if (isObject(type) && type.list) return {type: "list", base: "list", prefix: default_prefix}
  if (isObject(type) && type.union) return {type: "union", base: "union", prefix: default_prefix}
  
  let builtin_types = built_in_types(simpleTypes)
  let base = null // nome do tipo embutido em questão ou em qual é baseado o tipo atual
  let prefix = null

  if (type.includes(':')) {
    let split = type.split(':')
    type = split[1] // remover o prefixo do nome do tipo
    prefix = split[0]
  }
  // tipo embutido ou local desta schema
  else prefix = default_prefix

  // é um tipo da schema local, logo se não for embutido, é possível encontrar a sua base embutida na estrutura simpleTypes
  if (prefix == default_prefix) {
    // o 2º caso do if só acontece na get_base, porque os tipos ainda não foram parsed e colocados na simpleTypes
    if (builtin_types.includes(type) || !(type in simpleTypes)) base = type
    else base = simpleTypes[type].built_in_base
  }

  return {type, base, prefix}
}


// Funções auxiliares relativas a elementos <restriction> ----------

// criar um objeto com todos os tipos embutidos da XML Schema, com a estrutura da DSL {element, attrs, content}
function create_simpleTypes(default_prefix) {
  let obj = {}
  
  let primitive_types = ["string","boolean","decimal","float","double","duration","dateTime","time","date","gYearMonth","gYear","gMonthDay","gDay","gMonth","hexBinary","base64Binary","anyURI","QName","NOTATION"]
  
  // colocar os tipos primitivos no objeto
  for (let i = 0; i < primitive_types.length; i++) {
    let x = primitive_types[i]

    obj[x] = {
      XMLSchema: true,
      content: [{
        element: "whiteSpace",
        attrs: {
          value: x == "string" ? "preserve" : "collapse",
          fixed: true
        }
    }]}

    if (x == "string") obj[x].content[0].attrs.fixed = false
  }

  // colocar os tipos derivados por restrição no objeto
  let derivedTypes = [
    ["integer", "decimal", [["fractionDigits", 0, true]]],
    ["nonPositiveInteger", "integer", [["maxInclusive", 0, false]]],
    ["negativeInteger", "nonPositiveInteger", [["maxInclusive", -1, false]]],
    ["long", "integer", [["minInclusive", -9223372036854775808, false], ["maxInclusive", 9223372036854775807, false]]],
    ["int", "long", [["minInclusive", -2147483648, false], ["maxInclusive", 2147483647, false]]],
    ["short", "int", [["minInclusive", -32768, false], ["maxInclusive", 32767, false]]],
    ["byte", "short", [["minInclusive", -128, false], ["maxInclusive", 127, false]]],
    ["nonNegativeInteger", "integer", [["minInclusive", 0, false]]],
    ["positiveInteger", "nonNegativeInteger", [["minInclusive", 1, false]]],
    ["unsignedLong", "nonNegativeInteger", [["maxInclusive", 18446744073709551615, false]]],
    ["unsignedInt", "unsignedLong", [["maxInclusive", 4294967295, false]]],
    ["unsignedShort", "unsignedInt", [["maxInclusive", 65535, false]]],
    ["unsignedByte", "unsignedShort", [["maxInclusive", 255, false]]],
    ["normalizedString", "string", [["whiteSpace", "replace", false]]],
    ["token", "normalizedString", [["whiteSpace", "collapse", false]]],
    ["language", "token", [["pattern", "([a-zA-Z]{2}|[iI]-[a-zA-Z]+|[xX]-[a-zA-Z]{1,8})(-[a-zA-Z]{1,8})*", false]]],
    ["Name", "token", [["pattern", "[a-zA-Z:_][-_:\.a-zA-Z0-9]*", false]]],
    ["NCName", "Name", [["pattern", "[a-zA-Z_][-_\.a-zA-Z0-9]*", false]]],
    ["ID", "NCName", []],
    ["IDREF", "NCName", []],
    ["ENTITY", "NCName", []],
    ["NMTOKEN", "token", [["pattern", "[-_:\.a-zA-Z0-9]+", false]]],
    ["ENTITIES", "ENTITY", []],
    ["IDREFS", "IDREF", []],
    ["NMTOKENS", "NMTOKEN", []]
  ]

  derivedTypes.map(x => {
    let new_content =  x[2].map(r => {return {element: r[0], attrs: {value: r[1], fixed: r[2]}}})
    let base_content = JSON.parse(JSON.stringify(obj[x[1]].content)) // constraining facets do tipo-base
    obj[x[0]] = {XMLSchema: true, content: restrict2(x[0], {type: x[1], prefix: default_prefix}, base_content, new_content).data}
  })
  
  // colocar os tipos derivados por lista no objeto
  let list_types = [["ENTITIES","ENTITY"],["IDREFS","IDREF"],["NMTOKENS","NMTOKEN"]]
  list_types.forEach(x => {
    obj[x[0]].XMLSchema = true
    obj[x[0]].content = [{built_in_base: x[1], content: obj[x[0]].content}]
    obj[x[0]].list = [{ element: "minLength", attrs: {value: 1} }]
  })
  
  return obj
}



// validar o espaço léxico dos restraining facets que ainda faltam e verificar todas as restrições entre os facets dentro do mesmo elemento
function check_restrictionST_facets(parent, base, content, default_prefix, simpleTypes) {
  // simpleType não é uma faceta, remover temporariamente do conteúdo se tiver um
  let st = null, attrs = []
  if (content.length > 0) {
    if (content[0].element == "simpleType") st = content.shift()
    if (parent == "simpleContent") {
      attrs = content.filter(x => x.element.includes("attribute"))
      content = content.filter(x => !x.element.includes("attribute"))
    }
  }

  // se for um tipo-lista, a base devolvida pela getTypeInfo é dos elementos da lista
  let type = getTypeInfo(base, default_prefix, simpleTypes)
  if (!["list","union"].includes(type.type) && type.prefix == default_prefix) {
    // se for um tipo-lista, neste função interessa saber isso e não a base dos elementos da lista
    if ("list" in simpleTypes[type.type]) type = getTypeInfo({list: true}, default_prefix, simpleTypes)
  }
  
  // verificar se os valores especificados nas constraining facets pertencem ao espaço léxico do tipo em que se baseiam
  content = check_constrFacetBase(base, type, content)
  if ("error" in content) return content
  content = content.data

  let f = {pattern: [], enumeration: []} // objeto com os pares chave-valor
      
  for (let i = 0; i < content.length; i++) {
    let key = content[i].element,
        value = content[i].attrs.value
    
    // só os atributos "pattern" e "enumeration" é que podem aparecer várias vezes
    if (key == "pattern" || key == "enumeration") f[key].push(value)
    else {
      if (key in f) return error(`O elemento <b>&#60;${key}&#62;</b> só pode ser definido uma vez em cada elemento <b>&#60;restriction&#62;</b>!`)
      else f[key] = value
    }
  }

  // se não houver elementos "pattern" ou "enumeration", apagar essas chaves do objeto
  if (!f.enumeration.length) delete f.enumeration
  if (!f.pattern.length) delete f.pattern
  else f.pattern = f.pattern.map(x => '^('+x+')$').join("|") // se houver vários patterns no mesmo passo de derivação, são ORed juntos
  
  let err1 = (a1,a2) => error(`As facetas <b>&#60;${a1}&#62;</b> e <b>&#60;${a2}&#62;</b> são mutuamente exclusivas no mesmo passo de derivação!`)
  let err2 = (a1,a2,eq,int,offset) => error(`${int ? "Como o tipo-base diz respeito a números inteiros, o" : "O"} valor da faceta <b>&#60;${a1}&#62;</b> deve ser &#60;${eq} ao da <b>&#60;${a2}&#62;</b>${offset}!`)
  let err3 = (el,val,lim,comp) => error(`O valor <i>${val}</i> da faceta <b>&#60;enumeration&#62;</b> é ${comp} a <i>${lim}</i>, o que contradiz a faceta <b>&#60;${el}&#62;</b>!`)
  let err4 = (a1,a2,dig,val) => error(`O valor <i>${val}</i> da faceta <b>&#60;${a1}&#62;</b> só permite valores com mais de ${dig} dígitos, o que contradiz a faceta <b>&#60;${a2}&#62;</b>!`)
  let err5 = (el,dig,val,frac) => error(`O valor <i>${val}</i> da faceta <b>&#60;enumeration&#62;</b> tem mais do que ${dig} dígitos${frac ? " fracionários" : ""}, o que contradiz a faceta <b>&#60;${el}&#62;</b>!`)
  let err6 = (val) => error(`O valor <i>${val}</i> da faceta <b>&#60;enumeration&#62;</b> não obedece à expressão regular do(s) elemento(s) <b>&#60;pattern&#62;</b> no mesmo passo de derivação!`)
  let err7 = (el,val,len,comp) => error(`O valor <i>${val}</i> da faceta <b>&#60;enumeration&#62;</b> não tem comprimento ${comp} ${len}, o que contradiz a faceta <b>&#60;${el}&#62;</b>!`)
  let err8 = (el) => error(`É um erro o tipo-base não ter a faceta <b>&#60;${el}&#62;</b> se a restrição atual o tem, e a restrição atual ou o tipo-base têm a faceta <b>&#60;length&#62;</b>!`)
  let err9 = (el,base,val) => error(`O valor da faceta <b>&#60;${el}&#62;</b> para o tipo-base <b>${base}</b> deve ser ${val}, senão o espaço de valores válidos é vazio!`)

  let has = facet => facet in f

  // atributos mutuamente exclusivos
  if (has("maxInclusive") && has("maxExclusive")) return err1("maxInclusive", "maxExclusive")
  if (has("minInclusive") && has("minExclusive")) return err1("minInclusive", "minExclusive")
  if (has("length") && has("maxLength")) return err8("maxLength")
  if (has("length") && has("minLength")) return err8("minLength")
  
  // restrições relativas a colisões entre os valores dos constraining facets
  if (has("enumeration")) {
    for (let i = 0; i < f.enumeration.length; i++) {
      if (has("totalDigits") && countDigits(f.enumeration[i]) > f.totalDigits) return err5("totalDigits", f.totalDigits, f.enumeration[i], false)
      if (has("fractionDigits") && countFracDigits(f.enumeration[i]) > f.fractionDigits) return err5("fractionDigits", f.fractionDigits, f.enumeration[i], true)
      if (has("maxExclusive") && f.enumeration[i] >= f.maxExclusive) return err3("maxExclusive", f.enumeration[i], f.maxExclusive, "&#62;=")
      if (has("maxInclusive") && f.enumeration[i] > f.maxInclusive) return err3("maxInclusive", f.enumeration[i], f.maxInclusive, "&#62;")
      if (has("minExclusive") && f.enumeration[i] <= f.minExclusive) return err3("minExclusive", f.enumeration[i], f.minExclusive, "&#60;=")
      if (has("minInclusive") && f.enumeration[i] < f.minInclusive) return err3("minInclusive", f.enumeration[i], f.minInclusive, "&#60;")
      if (has("pattern") && !new RegExp(f.pattern).test(f.enumeration[i])) return err6(f.enumeration[i])
      if (has("length") && enumLength(f.enumeration[i], type.base) != f.length) return err7("length", f.enumeration[i], f.length, "=")
      if (has("maxLength") && enumLength(f.enumeration[i], type.base) > f.maxLength) return err7("maxLength", f.enumeration[i], f.maxLength, "&#60;=")
      if (has("minLength") && enumLength(f.enumeration[i], type.base) < f.minLength) return err7("minLength", f.enumeration[i], f.minLength, "&#62;=")
    }
  }
  if (has("totalDigits")) {
    if (has("fractionDigits") && f.fractionDigits > f.totalDigits) return err2("fractionDigits", "totalDigits", "=", false, "")
    if (has("maxExclusive") && f.maxExclusive < 0) {
      if (countIntDigits(f.maxExclusive) > f.totalDigits) return err4("maxExclusive", "totalDigits", f.totalDigits, f.maxExclusive)
      if (isBaseInt(type.type) && f.maxExclusive == parseInt(`-${'9'.repeat(f.totalDigits)}`)) return err4("maxExclusive", "totalDigits", f.totalDigits, f.maxExclusive)
    }
    if (has("minExclusive") && f.minExclusive > 0) {
      if (countIntDigits(f.minExclusive) > f.totalDigits) return err4("minExclusive", "totalDigits", f.totalDigits, f.minExclusive)
      if (isBaseInt(type.type) && f.minExclusive == parseInt('9'.repeat(f.totalDigits))) return err4("minExclusive", "totalDigits", f.totalDigits, f.minExclusive)
    }
    if (has("maxInclusive") && f.maxInclusive < 0 && countIntDigits(f.maxInclusive) > f.totalDigits) return err4("maxInclusive", "totalDigits", f.totalDigits, f.maxInclusive)
    if (has("minInclusive") && f.minInclusive > 0 && countIntDigits(f.minInclusive) > f.totalDigits) return err4("minInclusive", "totalDigits", f.totalDigits, f.minInclusive)
  }
  if (has("maxExclusive")) {
    if (has("minInclusive") && f.minInclusive >= f.maxExclusive) {
      if (type.type != "duration" || durationToMS(f.minInclusive) >= durationToMS(f.maxExclusive)) return err2("minInclusive", "maxExclusive", "=", false, "")
    }
    if (has("minExclusive")) {
      if (isBaseInt(type.type) && f.minExclusive >= f.maxExclusive-1) return err2("minExclusive", "maxExclusive", "", true, " - 1")
      else {
        let regex = null

        if (type.type == "date") regex = /^-?[0-9]{4,5}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/
        if (type.type == "dateTime") regex = /^-?[0-9]{4,5}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3])(:([0-5][0-9])){2}(\.\d+)?/
        if (type.type == "time") regex = /^([01][0-9]|2[0-3])(:([0-5][0-9])){2}(\.\d+)?/
        if (type.type == "gYear") regex = /^\-?\d+/
        if (type.type == "gYearMonth") regex = /^\-?\d{4,5}\-(0[1-9]|1[0-2])/
        if (type.type == "gDay") regex = /^\-{3}(0[1-9]|[12][0-9]|3[01])/
        if (type.type == "gMonth") regex = /^\-{2}(0[1-9]|1[0-2])/
        if (type.type == "gMonthDay") regex = /^\-{2}(0[1-9]|1[0-2])\-(0[1-9]|[12][0-9]|3[01])/
        
        if (type.type == "duration") {
          if (durationToMS(f.minExclusive) >= durationToMS(f.maxExclusive)-1) return err2("minExclusive", "maxExclusive", "=", false, " - 1")
        }
        else if (f.minExclusive >= f.maxExclusive) {
          if (regex !== null) return err2("minExclusive", "maxExclusive", "=", false, " - 1")
          return err2("minExclusive", "maxExclusive", "", false, "")
        }
        else if (regex !== null && adjacentASCII(f.minExclusive.match(regex)[0], f.maxExclusive.match(regex)[0])) return err2("minExclusive", "maxExclusive", "=", false, " - 1")
      }
    }
  }
  if (has("maxInclusive")) {
    if (has("minExclusive") && f.minExclusive >= f.maxInclusive) return err2("minExclusive", "maxInclusive", "", false, "")
    if (has("minInclusive") && f.minInclusive > f.maxInclusive) return err2("minInclusive", "maxInclusive", "=", false, "")
  }
  if (has("maxLength")) {
    if (has("minLength") && f.minLength > f.maxLength) return err2("minLength", "maxLength", "=", false, "")
  }

  // restrições relativas aos intervalos de valores válidos do tipo-base em questão
  if (type.type == "gDay") {
    if (has("maxExclusive") && f.maxExclusive.substring(0,5) == "---01") return err9("maxExclusive", "gDay", "&#62; '01'")
    if (has("minExclusive") && f.minExclusive.substring(0,5) == "---31") return err9("minExclusive", "gDay", "&#60; '31'")
  }
  if (type.type == "gMonth") {
    if (has("maxExclusive") && f.maxExclusive.substring(0,4) == "--01") return err9("maxExclusive", "gMonth", "&#62; '01'")
    if (has("minExclusive") && f.minExclusive.substring(0,4) == "--12") return err9("minExclusive", "gMonth", "&#60; '12'")
  }
  if (type.type == "gMonthDay") {
    if (has("maxExclusive") && f.maxExclusive.substring(0,7) == "--01-01") return err9("maxExclusive", "gMonthDay", "&#62; '01/01'")
    if (has("minExclusive") && f.minExclusive.substring(0,7) == "--12-31") return err9("minExclusive", "gMonthDay", "&#60; '12/31'")
  }
  if (type.type == "duration" && has("maxExclusive")) {
    let max = durationToMS(f.maxExclusive)
    if (!max) return err9("maxExclusive", "duration", "&#62; 0")
  }
  
  // se houver enumerações ou patterns, juntar todos os seus valores numa só faceta
  content = content.filter(x => x.element != "enumeration" && x.element != "pattern")
  if (has("enumeration")) content.push({element: "enumeration", attrs: {value: f.enumeration}})
  if (has("pattern")) content.push({element: "pattern", attrs: {value: f.pattern}})
  
  // adicionar de novo o simpleType ao conteúdo, caso o tenha removido no início da função
  if (st !== null) content.unshift(st)
  content = content.concat(attrs)
  return data(content)
}

// verificar se os valores especificados nas constraining facets pertencem ao espaço léxico do tipo em que se baseiam
// esta função só verifica o espaço léxico do atributo "value" dos elementos <minExclusive>, <minInclusive>, <maxExclusive>, <maxInclusive> e <enumeration>
// os restantes não dependem do tipo-base e já foram verificados antes
function check_constrFacetBase(base, type, content) {
  // criar um array com os nomes de todos os constraining facets do tipo-base
  let content_els = content.map(x => x.element)
  
  // criar array com o nome dos constraining facets válidos para o tipo em questão
  let facets = []

  switch (type.base) {
    case "anyURI": case "base64Binary": case "ENTITY": case "hexBinary": case "ID": case "IDREF": case "language": case "Name": case "NCName": 
    case "NMTOKEN": case "normalizedString": case "NOTATION": case "QName": case "string": case "token":
      facets = ["enumeration","length","maxLength","minLength","pattern"]; break

    case "boolean": facets = ["pattern"]; break

    case "byte": case "decimal": case "int": case "integer": case "long": case "negativeInteger": case "nonNegativeInteger": case "nonPositiveInteger":
    case "positiveInteger": case "short": case "unsignedByte": case "unsignedInt": case "unsignedLong": case "unsignedShort":
      facets = ["enumeration","fractionDigits","maxExclusive","maxInclusive","minExclusive","minInclusive","pattern","totalDigits"]; break

    case "date": case "dateTime": case "double": case "duration": case "float": case "gDay": case "gMonth": case "gMonthDay": case "gYear": case "gYearMonth": case "time":
    facets = ["enumeration","maxExclusive","maxInclusive","minExclusive","minInclusive","pattern"]; break

    case "list": case "ENTITIES": case "IDREFS": case "NMTOKENS": 
      facets = ["enumeration","length","maxLength","minLength","pattern"]; break

    case "union":
      facets = ["enumeration","pattern"]; break
  }

  // o elemento <whiteSpace> pode aparecer em qualquer tipo-base
  if (type.base != "union") facets.push("whiteSpace")

  // verificar se facets possui todos os elementos de content_els para ver se há algum constraining facet inválido no tipo em questão
  if (!content_els.every(v => facets.includes(v))) {
    let init_err = `O tipo <b>${type.type}</b>`
    if (["list","union"].includes(type.type)) init_err = "Um tipo derivado por " + (type.type == "list" ? "lista" : "união")

    return error(`${init_err} só permite os elementos de restrição <b>&#60;${facets.join("&#62;</b>, <b>&#60;")}&#62;</b>!`)
  }

  // verificar se o atributo "value" pertence ao espaço léxico do tipo-base
  // no caso de listas, só seria preciso verificar os <enumeration> aqui e isso é feito na check_listEnumeration
  for (let i = 0; i < content.length; i++) {
    if ((!isListType(type.base) && type.base != "union") && ["minExclusive","minInclusive","maxExclusive","maxInclusive","enumeration"].includes(content[i].element)) {
      let value = check_constrFacetBase_aux(base, type.base, content[i].attrs.value)

      if ("error" in value) return value
      content[i].attrs.value = value.data
    }
  }
  
  return data(content)
}

// verificar se o valor pertence ao espaço léxico do tipo em que se baseia (por regex)
// base_name tem o prefixo para printar no erro, base_type não
function check_constrFacetBase_aux(base_name, base_type, value) {
  let error_msg = `<b>${value}</b> não é um valor válido para o tipo <b>${base_name}</b>!`

  switch (base_type) {
    case "boolean":
      if (value === "true") value = true
      else if (value === "false") value = false
      else return error(error_msg); break
    case "byte": case "int": case "integer": case "long": case "short":
    case "unsignedByte": case "unsignedInt": case "unsignedLong": case "unsignedShort":
      if (!/^(\+|\-)?\d+$/.test(value)) return error(error_msg)
      value = parseInt(value)

      let min, max
      if (base_type == "byte") {min = -128; max = 127}
      if (base_type == "short") {min = -32768; max = 32767}
      if (base_type == "int") {min = -2147483648; max = 2147483647}
      if (base_type == "long") {min = -9223372036854775808; max = 9223372036854775807}
      if (base_type == "unsignedByte") {min = 0; max = 255}
      if (base_type == "unsignedShort") {min = 0; max = 65535}
      if (base_type == "unsignedInt") {min = 0; max = 4294967295}
      if (base_type == "unsignedLong") {min = 0; max = 18446744073709551615}

      if (value === NaN || (base_type != "integer" && !(value >= min && value <= max))) return error(error_msg); break
    case "date":
      if (!/^-?[0-9]{4,5}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))?$/.test(value)) return error(error_msg); break
    case "dateTime":
      if (!/^-?[0-9]{4,5}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3])(:([0-5][0-9])){2}(\.\d+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))?$/.test(value)) return error(error_msg); break
    case "decimal":
      if (!/^(\+|-)?(\.\d+|\d+(\.\d+)?)$/.test(value)) return error(error_msg)
      value = parseFloat(value); break
    case "double":
    case "float":
      if (!/^((\+|-)?((\.\d+|\d+(\.\d+)?)([eE](\+|-)?\d+)?)|-?INF|NaN)$/.test(value)) return error(error_msg)
      value = base_type == "double" ? parseDouble(value) : parseFloat(value); break
    case "duration":
      if (!/^-?P(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(((\d+)(\.\d+)?|(\.\d+))S)?)?$/.test(value)) return error(error_msg); break
    case "ENTITY": case "ID": case "IDREF": case "NCName":
      if (!/^([a-zA-Z_]|[^\x00-\x7F])([a-zA-Z0-9\.\-_]|[^\x00-\x7F])*$/.test(value)) return error(error_msg); break
    case "gDay":
      if (!/^\-{3}(0[1-9]|[12][0-9]|3[01])(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))?$/.test(value)) return error(error_msg); break
    case "gMonth":
      if (!/^\-{2}(0[1-9]|1[0-2])(\-{2})?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))?$/.test(value)) return error(error_msg); break
    case "gMonthDay":
      if (!/^\-{2}(0[1-9]|1[0-2])\-(0[1-9]|[12][0-9]|3[01])(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))?$/.test(value)) return error(error_msg); break
    case "gYear":
      if (!/^\-?\d{4,5}(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))?$/.test(value)) return error(error_msg); break
    case "gYearMonth":
      if (!/^\-?\d{4,5}\-(0[1-9]|1[0-2])(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))?$/.test(value)) return error(error_msg); break
    case "language":
      if (!/^([a-zA-Z]{2}|[iI]\-[a-zA-Z]+|[xX]\-[a-zA-Z]{1,8})(\-[a-zA-Z]{1,8})*$/.test(value)) return error(error_msg); break
    case "Name":
      if (!/^([a-zA-Z_:]|[^\x00-\x7F])([a-zA-Z0-9\.:\-_]|[^\x00-\x7F])*$/.test(value)) return error(error_msg); break
    case "negativeInteger":
      if (!/^-\d+$/.test(value)) return error(error_msg)
      value = parseInt(value)
      if (value === NaN || !(value <= -1)) return error(error_msg); break
    case "NMTOKEN":
      if (!/^([a-zA-Z0-9\.:\-_]|[^\x00-\x7F])+$/.test(value)) return error(error_msg); break
    case "nonNegativeInteger":
      if (!/^\+?\d+$/.test(value)) return error(error_msg)
      value = parseInt(value)
      if (value === NaN || !(value >= 0)) return error(error_msg); break
    case "nonPositiveInteger":
      if (!/^0+|\-\d+$/.test(value)) return error(error_msg)
      value = parseInt(value)
      if (value === NaN || !(value <= 0)) return error(error_msg); break
    case "positiveInteger":
      if (!/^\+?\d+$/.test(value)) return error(error_msg)
      value = parseInt(value)
      if (value === NaN || !(value >= 1)) return error(error_msg); break
    case "normalizedString":
      value = value.trim().replace(/[\t\n\r]/g," "); break
    case "NOTATION":
    case "QName":
      if (!/^(([a-zA-Z_]|[^\x00-\x7F])([a-zA-Z0-9\.\-_]|[^\x00-\x7F])*:)?([a-zA-Z_]|[^\x00-\x7F])([a-zA-Z0-9\.\-_]|[^\x00-\x7F])*$/.test(value)) return error(error_msg)
      let split = value.split(":")
      if (split.length == 2 && !existsPrefix(split[0])) return error(error_msg); break
    case "time":
      if (!/^([01][0-9]|2[0-3])(:([0-5][0-9])){2}(\.\d+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))?$/.test(value)) return error(error_msg); break
    case "token":
      value = value.trim().replace(/[\t\n\r]/g," ").replace(/ +/g," "); break
  }

  return data(value)
}

// retorna os tipos base de um simpleType (pode ter vários caso involva unions)
function get_base(st_content, default_prefix, simpleTypes) {
  let fst_content = st_content[0]
  let base = []

  if (fst_content.element == "union") {
    if ("memberTypes" in fst_content.attrs) base = fst_content.attrs.memberTypes.map(x => getTypeInfo(x, default_prefix, simpleTypes).type)
    base = base.concat(fst_content.content.map(x => getTypeInfo(x.attrs.name, default_prefix, simpleTypes).type))
    return base
  }

  if (fst_content.element == "list")
    base = "itemType" in fst_content.attrs ? fst_content.attrs.itemType : fst_content.content[0].attrs.name

  if (fst_content.element == "restriction") {
    if ("base" in fst_content.attrs) base = fst_content.attrs.base
    else base = fst_content.content[0].attrs.name
  }
  
  return [getTypeInfo(base, default_prefix, simpleTypes).type]
}

// name = nome do novo tipo, st_content = conteúdo do novo simpleType
function restrict(name, st_content, default_prefix, simpleTypes) {
  let base, base_content, new_content, fst_content = st_content[0]

  // está a derivar um simpleType por união
  if (fst_content.element == "union") {
    return restrict_union(name, fst_content.attrs, fst_content.content, [], default_prefix, simpleTypes)
  }
  
  // está a derivar um simpleType por lista
  if (fst_content.element == "list") {
    // se tiver atributo itemType, colocar o conteúdo do tipo respetivo no conteúdo para uniformizar com os casos em que vem com o simpleType definido dentro
    if ("itemType" in fst_content.attrs) {
      let type = getTypeInfo(fst_content.attrs.itemType, default_prefix, simpleTypes)
      let st = JSON.parse(JSON.stringify(simpleTypes[type.type]))
      if (!("built_in_base" in st)) st.built_in_base = type.base
      fst_content.content.push({element: "simpleType", attrs: {}, ...st})
    }

    // não permitir criar listas de listas
    if ("list" in fst_content.content[0] || ("union" in fst_content.content[0] && fst_content.content[0].union.some(x => "list" in x))) {
      let name_str = name !== undefined ? ` <b>${name}</b>` : ""
      let base_str = "itemType" in fst_content.attrs ? ` <b>${fst_content.attrs.itemType}</b>` : ""
      return error(`Na definição do tipo-lista${name_str}, o tipo-base${base_str} é inválido porque ou é um tipo-lista, ou um tipo-união que contém uma lista!`)
    }

    return restrict_list(name, fst_content.content[0], [], default_prefix, simpleTypes)
  }

  // está a derivar um simpleType por restrição
  if (fst_content.element == "restriction") {
    if (fst_content.content.length > 0 && fst_content.content[0].element == "simpleType") {
      new_content = fst_content.content.filter((x,i) => i>0)

      if ("union" in fst_content.content[0]) {
        return restrict_union(name, {}, fst_content.content[0].union, new_content, default_prefix, simpleTypes)
      }
      // se estiver a restringir um tipo derivado por lista, as novas restrições são relativas à lista e não ao tipo-base
      else if ("list" in fst_content.content[0]) {
        return restrict_list(name, fst_content.content[0], new_content, default_prefix, simpleTypes)
      }
      else {
        base = fst_content.content[0].built_in_base
        base_content = fst_content.content[0].content
      }
    }
    else {
      new_content = fst_content.content // constraining facets do novo tipo
      base = fst_content.attrs.base
      let type = getTypeInfo(base, default_prefix, simpleTypes) 

      base_content = JSON.parse(JSON.stringify(simpleTypes[type.type]))

      if ("union" in base_content) return restrict_union(name, {}, base_content.union, new_content, default_prefix, simpleTypes)
      // se for um tipo-lista, os constraining facets base são relativos à lista, senão ao tipo-base
      if ("list" in base_content) return restrict_list(name, base_content, fst_content.content, default_prefix, simpleTypes)
      else base_content = base_content.content
    }
  }
  
  let type = getTypeInfo(base, default_prefix, simpleTypes) // tipo-base
  let content = restrict2(name, type, base_content, new_content)
  if ("error" in content) return content

  return data({built_in_base: type.base, content: content.data})
}

// name = nome do novo tipo, base = nome do tipo-base, new_content = facetas do novo tipo, st = simpleTypes
function restrict2(name, base, base_content, new_content) {
  let base_els = base_content.map(x => x.element) // nomes das constraining facets do tipo-base

  for (let i = 0; i < new_content.length; i++) {
    let new_facet = new_content[i].element // nome da faceta em questão no tipo novo
    let new_value = new_content[i].attrs.value // valor da faceta em questão no tipo novo

    // função para invocar a função auxiliar que verifica uma condição de recursividade
    let aux = arr => {
      let results = []

      arr.map(x => {
        if (x[1] == "include") {
        }
        for (let i = 0; i < (new_facet == "enumeration" ? new_value.length : 1); i++) {
          results.push(restrict_aux(name, base, x[0], new_facet, base_els, base_content, new_facet == "enumeration" ? new_value[i] : new_value, x[1]))
        }
      })

      let errors = results.filter(x => "error" in x)
      return errors.length > 0 ? errors[0] : data(true)
    }
    
    let aux_result
    switch (new_facet) {
      case "totalDigits": aux_result = aux([["totalDigits", "inf_eq"]]); break
      case "fractionDigits": aux_result = aux([["totalDigits", "inf_eq"], ["fractionDigits", "inf_eq"], ["enumeration", "frac_enum"]]); break
      case "maxExclusive": aux_result = aux([["totalDigits", "inf_dig"], ["fractionDigits", "inf_fracDig"], ["maxExclusive", "inf_eq"], 
                                ["maxInclusive", "inf_eq"], ["minExclusive", "sup"], ["minInclusive", "sup"], ["enumeration", "include"]]); break
      case "maxInclusive":
      case "minInclusive": aux_result = aux([["totalDigits", "inf_dig"], ["fractionDigits", "inf_fracDig"], ["maxExclusive", "inf"], 
                                ["maxInclusive", "inf_eq"], ["minExclusive", "sup"], ["minInclusive", "sup_eq"], ["enumeration", "include"]]); break
      case "minExclusive": aux_result = aux([["totalDigits", "inf_dig"], ["fractionDigits", "inf_fracDig"], ["maxExclusive", "inf"], 
                                ["maxInclusive", "inf"], ["minExclusive", "sup_eq"], ["minInclusive", "sup_eq"], ["enumeration", "include"]]); break
      case "pattern": aux_result = aux([["enumeration", "match_parent"]]); break
      case "enumeration": aux_result = aux([["totalDigits", "inf_dig"], ["fractionDigits", "inf_fracDig"], ["maxExclusive", "inf"], 
                                ["maxInclusive", "inf_eq"], ["minExclusive", "sup"], ["minInclusive", "sup_eq"], ["enumeration", "include"],
                                ["pattern", "match_child"], ["length", "len_eq"], ["maxLength", "len_inf_eq"], ["minLength", "len_sup_eq"]]); break
      case "length": aux_result = aux([["enumeration", "len_parent_eq"], ["length", "eq"], ["maxLength", "inf_eq"], ["minLength", "sup_eq"]]); break
      case "maxLength": aux_result = aux([["enumeration", "len_parent_sup_eq"], ["length", "mutex"], ["maxLength", "inf_eq"], ["minLength", "sup_eq"]]); break
      case "minLength": aux_result = aux([["enumeration", "len_parent_inf_eq"], ["length", "mutex"], ["maxLength", "inf_eq"], ["minLength", "sup_eq"]]); break
      case "whiteSpace": aux_result = aux([["whiteSpace", "whiteSpace"]]); break
    }
    if ("error" in aux_result) return aux_result

    // se houver enumerações acima na hierarquia, passam a ser válidos apenas os valores que obedecem ao pattern
    let updateEnumByPattern = () => {
      if (base_els.includes("enumeration")) {
        let ind = base_content.findIndex(x => x.element == "enumeration")
        base_content[ind].attrs.value = base_content[ind].attrs.value.filter(x => new RegExp(new_value).test(x))
      }
    }
    
    // atualizar o valor de uma faceta, depois de verificar todas as condições de recursividade
    if (base_els.includes(new_facet)) {
      let index = base_content.findIndex(x => x.element == new_facet)

      // patterns em passos de derivação diferentes são ANDed
      if (new_facet == "pattern") {
        base_content[index].attrs.value = `^(?=${base_content[index].attrs.value})(?=${new_value})${new_value}$`
        updateEnumByPattern()
      }
      else base_content[index].attrs.value = new_value
    }
    else {
      base_content.push(new_content[i])
      updateEnumByPattern()
    }

    // função para remover uma faceta mutualmente exclusiva na nova
    let remove_mutex = (facet, mutex) => {if (new_facet == facet && base_els.includes(mutex)) base_content.splice(base_content.findIndex(x => x.element == mutex), 1) }

    remove_mutex("maxExclusive","maxInclusive")
    remove_mutex("maxInclusive","maxExclusive")
    remove_mutex("minExclusive","minInclusive")
    remove_mutex("minInclusive","minExclusive")
  }
  
  return data(base_content)
}

function restrict_aux(name, base, base_facet, new_facet, base_els, base_content, new_value, cond) {
  // tipo-base para usar nas condições (enumLength)
  let base_type = base.type
  // na mensagem de erro, imprimir o nome do tipo com prefixo, se tiver um
  base = base.prefix === null ? base.type : (base.prefix + ":" + base.type)

  if (cond == "mutex" && base_els.includes(base_facet))
    return error(`É um erro o tipo-base não ter a faceta <b>&#60;${new_facet}&#62;</b> se a restrição atual o tem, e a restrição atual ou o tipo-base têm a faceta <b>&#60;length&#62;</b>!`)

  // tipos de mensagens de erro
  let err_str = {
    fixed: facet => `o valor para <b>&#60;${facet}&#62;</b> foi fixado a`,
    compare: (facet, comp) => `deve ser ${comp} ${comp == "=" ? "a" : "que "}o valor de <b>&#60;${facet}&#62;</b> que foi definido como`,
    length: (facet, inf_sup) => `o seu comprimento deve ser ${inf_sup}= ao valor de <b>&#60;${facet}&#62;</b> que foi definido como`,
    digits: (frac) => `o número total de dígitos${frac ? " fracionários" : ""} foi limitado a`,
    enum: () => `não pertence ao espaço de valores de enumeração do tipo-base${!["xs:list","xs:union"].includes(base) ? `, <b>${base}</b>` : ""}`,
    parent_enum: () => `nenhum dos valores do espaço de enumeração do tipo-base${!["xs:list","xs:union"].includes(base) ? `, <b>${base}</b>` : ""}, obedece a essa restrição`,
    match_child: (facet) => `não obedece ao formato de <b>&#60;${facet}&#62;</b> que foi definido como`,
    ws: () => `o valor de <b>&#60;whiteSpace&#62;</b> foi definido como`
  }

  let err = (facet, base_val, new_val, err_type, err_args, end) => 
    error(`Na definição d${name !== undefined ? `e <b>${name}</b>` : "o novo simpleType"}, o valor <i>${new_val}</i> da faceta <b>&#60;${facet}&#62;</b> é inválido, porque ${err_str[err_type](...err_args)}${end ? ` <i>${base_val}</i> num dos seus tipos ancestrais` : ""}!`)

  if (base_els.includes(base_facet)) {
    // ir buscar o valor da faceta em questão ao tipo-base
    let index = base_content.findIndex(x => x.element == base_facet)
    let base_attrs = base_content[index].attrs
    let base_value = base_attrs.value

    // se a faceta já existir no tipo-base, verificar se é fixed lá
    if (base_facet == new_facet && base_facet != "enumeration") {
      if (base_attrs.fixed && base_value != new_value) return err(new_facet, base_value, new_value, "fixed", [new_facet], true)
    }

    let err_args = []
    switch (cond) {
      case "eq": if (!(base_value == new_value)) err_args = ["compare", [base_facet, "="], true]; break
      case "inf": if (!(base_value > new_value)) err_args = ["compare", [base_facet, "&#60;"], true]; break
      case "inf_eq": if (!(base_value >= new_value)) err_args = ["compare", [base_facet, "&#60;="], true]; break
      case "sup": if (!(base_value < new_value)) err_args = ["compare", [base_facet, "&#62;"], true]; break
      case "sup_eq": if (!(base_value <= new_value)) err_args = ["compare", [base_facet, "&#62;="], true]; break
      case "len_eq": if (!(base_value == enumLength(new_value, base_type))) err_args = ["length", [base_facet, ""], true]; break
      case "len_inf_eq": if (!(base_value >= enumLength(new_value, base_type))) err_args = ["length", [base_facet, "&#60;"], true]; break
      case "len_sup_eq": if (!(base_value <= enumLength(new_value, base_type))) err_args = ["length", [base_facet, "&#62;"], true]; break
      case "frac_enum": if (Math.min(...base_value.map(x => countFracDigits(x))) > new_value) err_args = ["parent_enum", [], false]; break
      case "inf_dig": if (base_value < countDigits(new_value)) err_args = ["digits", [false], true]; break
      case "inf_fracDig": if (base_value < countFracDigits(new_value)) err_args = ["digits", [true], true]; break
      case "include": if (!base_value.includes(new_value)) err_args = ["enum", [], false]; break
      case "match_parent": if (!base_value.some(x => new RegExp(new_value).test(x))) err_args = ["parent_enum", [], false]; break
      case "match_child": if (!new RegExp(base_value).test(new_value)) err_args = ["match_child", [base_facet], true]; break
      case "len_parent_eq": if (!base_value.some(x => enumLength(x, base_type) == new_value)) err_args = ["parent_enum", [], false]; break
      case "len_parent_inf_eq": if (!base_value.some(x => enumLength(x, base_type) >= new_value)) err_args = ["parent_enum", [], false]; break
      case "len_parent_sup_eq": if (!base_value.some(x => enumLength(x, base_type) <= new_value)) err_args = ["parent_enum", [], false]; break
      case "whiteSpace": if ((base_value == "collapse" && base_value != new_value) || (base_value == "replace" && new_value == "preserve")) err_args = ["ws", [], true]; break
    }
    
    if (err_args.length > 0) return err(new_facet, base_value, new_value, ...err_args)
  }
  
  return data(true)
}



function restrict_list(name, base, list_new_content, default_prefix, simpleTypes) {
  let type = getTypeInfo({list: true}, default_prefix, simpleTypes)

  // facetas base relativas à lista
  let list_base_content = "list" in base ? base.list : []

  // todos os tipos base dos elementos desta lista
  let elem_bases
  if ("list" in base) elem_bases = base.content.map(x => x.built_in_base)
  else elem_bases = "union" in base ? base.union.map(x => x.built_in_base) : [base.built_in_base]

  // estrutura com conteúdo(s) e built_in_base(s)
  let elem_content
  if ("list" in base) elem_content = base.content
  else elem_content = "union" in base ? base.union : [{built_in_base: base.built_in_base, content: base.content}]

  // verificar se só tem facetas válidas relativas a listas
  list_new_content = check_constrFacetBase("list", type, list_new_content)
  if ("error" in list_new_content) return list_new_content
  list_new_content = list_new_content.data

  // se tiver uma enumeration da lista, temos de validar semanticamente cada elemento da lista, de acordo com o seu tipo-base
  let enum_facet = list_new_content.filter(x => x.element == "enumeration")
  if (enum_facet.length > 0) {
    let check = check_listEnumeration(elem_bases, enum_facet[0].attrs.value)
    if ("error" in check) return check
  }

  // verificar a recursividade das facetas
  list_new_content = restrict2(name, type, list_base_content, list_new_content)
  if ("error" in list_new_content) return list_new_content
  
  return data({list: list_new_content.data, content: elem_content})
}

// validar os elementos de enumerações de listas individualmente conforme o seu tipo-base
function check_listEnumeration(bases, enumerations) {
  for (let i = 0; i < enumerations.length; i++) {
    let values = enumerations[i].split(/[ \t\n\r]+/g)

    for (let j = 0; j < values.length; j++) {
      let check = bases.map(b => check_constrFacetBase_aux(b, b, values[j]))
      if (check.every(x => "error" in x)) return error(`<i>${values[j]}</i> não é um valor válido para nenhum dos tipos-base da lista <b>${bases.join("</b>, <b>")}</b>!`)
    }
  }

  return data(true)
}



function restrict_union(name, attrs, types, new_facets, default_prefix, simpleTypes) {
  let memberTypes = "memberTypes" in attrs ? attrs.memberTypes : []

  memberTypes.map(x => {
    let type = getTypeInfo(x, default_prefix, simpleTypes)
    let st = JSON.parse(JSON.stringify(simpleTypes[type.type]))
    
    if (!["built_in_base","list","union"].some(x => x in st)) st.built_in_base = type.base
    if ("union" in st) types = types.concat(st.union)
    else types.push(st)
  })
  // verificar se só tem facetas válidas relativas a restrições de uniões
  new_facets = check_constrFacetBase("union", getTypeInfo({union: true}, default_prefix, simpleTypes), new_facets)
  if ("error" in new_facets) return new_facets
  new_facets = new_facets.data

  new_facets = check_unionFacets(name, types, new_facets, default_prefix, simpleTypes)
  if ("error" in new_facets) return new_facets
  new_facets = new_facets.data
  
  if (!new_facets.length) return data({union: types})
  return data({built_in_base: {union: true}, content: new_facets})
}

function check_unionFacets(name, types, new_facets, default_prefix, simpleTypes) {
  let f = {pattern: [], enumeration: []} // objeto com os pares chave-valor
  new_facets.map(x => f[x.element].push(x.attrs.value))
  
  // se não houver elementos "pattern" ou "enumeration", apagar essas chaves do objeto
  if (!f.enumeration.length) delete f.enumeration
  if (!f.pattern.length) delete f.pattern
  else f.pattern = f.pattern.map(x => '^('+x+')$').join("|") // se houver vários patterns no mesmo passo de derivação, são ORed juntos

  // se houver enumerações ou patterns, juntar todos os seus valores numa só faceta
  let final_facets = []
  if ("enumeration" in f) final_facets.push({element: "enumeration", attrs: {value: f.enumeration}})
  if ("pattern" in f) final_facets.push({element: "pattern", attrs: {value: f.pattern}})
  
  // verificar se as facetas enumeration e pattern na mesma restrição não se contradizem
  if ("pattern" in f) {
    if ("enumeration" in f) {
      for (let i = 0; i < f.enumeration.length; i++) {
        if (!new RegExp(f.pattern).test(f.enumeration[i])) {
          return error(`O valor <i>${f.enumeration[i]}</i> da faceta <b>&#60;enumeration&#62;</b> não obedece à expressão regular do(s) elemento(s) <b>&#60;pattern&#62;</b> no mesmo passo de derivação!`)
        }
      }
    }
  }
  
  if ("enumeration" in f) {    
    // função auxiliar para verificar se pelo menos um dos valores enumerados é lexicamente válido para este tipo
    let check_types = (types, enum_value, arr) => {
      types.map(t => {
        if ("list" in t) t.content.map(tt => arr.push({type: t, result: check_listEnumeration([tt.built_in_base], [enum_value])}))
        else arr.push({type: t, result: check_listEnumeration([t.built_in_base], [enum_value])})
      })
      return arr
    }

    // verificar se todos os valores enumerados são válidos lexicamente e em termos de recursividade de facetas para um dos tipos base, no mínimo
    let list_type = getTypeInfo({list: true}, default_prefix, simpleTypes)    
    let check = f.enumeration.map(x => {
      // verificar se pelo menos um dos valores enumerados é lexicamente válido para este tipo
      let res = check_types(types, x, [])

      res.map((y,i) => {
        if ("data" in y.result) {
          // verificar se a recursividade das facetas é válida para este tipo e este valor de enumeração
          let type = "list" in y.type ? list_type : getTypeInfo(y.type.built_in_base, default_prefix, simpleTypes)
          let fac = final_facets.filter(z => z.element != "enumeration").concat([{element: "enumeration", attrs: {value: [x]}}])

          res[i] = restrict2(name, type, "list" in y.type ? y.type.list : y.type.content, fac)
        }
        else res[i] = false
      })
      
      return res
    })

    for (let i = 0; i < check.length; i++) {
      // neste caso, o valor não é lexicamente válido para nenhum dos tipos base
      if (check[i].every(x => !x)) return error(`<b>${f.enumeration[i]}</b> não é um valor válido para nenhum dos tipos-base da união!`)

      // imprimir as mensagens de erro dos tipos lexicamente válidos, se as facetas não estiverem corretas
      if (check[i].every(x => !x || "error" in x)) {
        check[i] = check[i].filter(x => x !== false)
        let fst_error = check[i].shift()

        if (check[i].length > 0) {
          check[i].map((x,j) => check[i][j] = x.error.slice(0,-1).split(",").filter((_,ind) => ind>0).join(","))
          return error(fst_error.error.slice(0,-1) + ";" + check[i].join(";"))
        }
        return error(fst_error.error)
      }
    }
  }

  return data(final_facets)
}

module.exports = {
  isObject,
  built_in_types,
  getTypeInfo,
  validate_TypeRef,
  create_simpleTypes,
  get_base,
  restrict,
  check_restrictionST_facets
}
