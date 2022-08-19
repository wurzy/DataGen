const {parseSimpleType} = require('./simpleType')

let default_prefix = null
let xsd_content = []
let simpleTypes = {}
let complexTypes = {}
let recursiv = {}
let SETTINGS = {}
let temp_structs = 0

// tabs de indentação
const indent = depth => "\t".repeat(depth)
// escolher uma QM que não seja usada na própria string
const chooseQM = str => str.includes('"') ? "'" : '"'
// nomes dos elementos recursivos da schema de um certo tipo
const recursiveEls = el => Object.keys(recursiv[el])

// criar array com os nomes do tipos embutidos da XML Schema
const built_in_types = () => {
   let types = []
   for (let p in simpleTypes) if (!("built_in_base" in simpleTypes[p])) types.push(p)
   return types
}

// assegurar que todos os elementos têm 1 ocorrência, se não for especificado
function default_occurs(attrs) {
   if (!("minOccurs" in attrs || "maxOccurs" in attrs)) {
      attrs.minOccurs = 1
      attrs.maxOccurs = 1
   }
}

// identificar os elementos recursivos da schema
function checkRecursion(xsd_content, complexTypes) {
   let recursiv = {element: {}, complexType: {}, group: {}}

   // complexType
   for (let t in complexTypes) {
      if (recursiveElement(complexTypes[t].attrs.name, "element", "type", complexTypes[t].content)) recursiv.complexType[complexTypes[t].attrs.name] = 0
   }

   // element e group
   for (let i = 0; i < xsd_content.length; i++) {
      let el = xsd_content[i]
      if ("content" in el && recursiveElement(el.attrs.name, el.element, "ref", el.content)) recursiv[el.element][el.attrs.name] = 0
   }

   return recursiv
}

// verificar se um elemento concreto da schema é recursivo
function recursiveElement(name, element, attr, content) {
   for (let i = 0; i < content.length; i++) {
       if (content[i].element == element && attr in content[i].attrs && content[i].attrs[attr] == name) return true
       if (content[i].element != "simpleType" && Array.isArray(content[i].content) && content[i].content.length > 0) {
           if (recursiveElement(name, element, attr, content[i].content)) return true
       }
   }
   return false
}

// determinar o nome e prefixo de schema do tipo em questão e o nome da sua base embutida
/* operacional apenas para tipos da schema local */
function getTypeInfo(type) {
   let builtin_types = built_in_types()
   let base = null // nome do tipo embutido em questão ou em qual é baseado o tipo atual
   let prefix = null
   let complex = false

   if (type.includes(':')) {
     let split = type.split(':')
     type = split[1] // remover o prefixo do nome do tipo
     prefix = split[0]
   }
   // tipo embutido ou local desta schema
   else prefix = default_prefix

   // é um tipo da schema local, logo se não for embutido, é possível encontrar a sua base embutida na estrutura simpleTypes
   if (prefix == default_prefix) {
      if (Object.keys(complexTypes).includes(type)) complex = true
      else base = builtin_types.includes(type) ? type : simpleTypes[type].built_in_base
   }

   return {type, complex, base, prefix}
}

function normalizeName(name, end_prefix, prefixed) {
   let prefix = "DFXS_"

   if (/\.|\-/.test(name)) {
      prefix += "NORMALIZED_"
      name = name.replace(/\./g, "__DOT__").replace(/\-/g, "__HYPHEN__")
   }

   return ((!prefixed && prefix == "DFXS_") ? "" : (prefix + end_prefix)) + name + ": "
}

function convert(xsd, st, ct, main_elem, user_settings) {
   // variáveis globais
   default_prefix = xsd.prefix
   xsd_content = xsd.content
   simpleTypes = st
   complexTypes = ct
   SETTINGS = user_settings
   recursiv = checkRecursion(xsd_content, ct)
   temp_structs = 0

   let depth = 1, new_temp_structs = 1
   let str = `<!LANGUAGE ${SETTINGS.datagen_language}>\n{\n`

   let elements = xsd.content.filter(x => x.element == "element")
   if (!elements.length) str += indent(depth) + "DFXS_EMPTY_XML: true\n"
   else {
      let parsed = parseElement(elements.find(x => x.attrs.name == main_elem), depth, true)
      if (parsed.length > 0) str += indent(depth) + parsed + "\n"
   }

   str += "}"
   str = str.replace(/DFXS_(TEMP|FLATTEN)__\d+/g, (m) => m.replace(/\d+$/, "") + new_temp_structs++)
   return str
}

// schemaElem indica se é o <element> é uma coleção ou não
function parseElement(el, depth, schemaElem) {
   if ("ref" in el.attrs) return parseRef(el, depth)

   default_occurs(el.attrs)
   if (el.attrs.maxOccurs == "unbounded") el.attrs.maxOccurs = SETTINGS.unbounded

   // atualizar o mapa de recursividade, se for o caso
   let recursiv_el = null
   if (recursiveEls("element").includes(el.attrs.name)) recursiv_el = {ref: recursiv.element, key: el.attrs.name}
   else if ("type" in el.attrs && xsd_content.some(x => x.element == "complexType" && x.attrs.name == el.attrs.type)) {
      if (recursiveEls("complexType").includes(el.attrs.type)) recursiv_el = {ref: recursiv.complexType, key: el.attrs.type}
   }

   if (recursiv_el !== null) {
      // se este novo elemento recursivo ultrapassar a recursividade máxima, não produzir
      if (recursiv_el.ref[recursiv_el.key] == SETTINGS.recursion.upper) return ""
      else {
         // se o elemento recursivo ainda não tiver cumprido a recursividade mínima, obrigar que seja produzido
         if (recursiv_el.ref[recursiv_el.key] < SETTINGS.recursion.lower && !el.attrs.minOccurs) el.attrs.minOccurs = 1
         recursiv_el.ref[recursiv_el.key]++ 
      }     
   }

   let min = el.attrs.minOccurs, max = el.attrs.maxOccurs
   let repeat = min!=1 || max!=1, base_depth = depth + (repeat ? 1 : 0)

   let str = "", name = normalizeName(el.attrs.name, "ELEM__", false)
   let parsed = parseElementAux(el, name, base_depth, schemaElem)

   str = !parsed.str.length ? "{ DFXS_EMPTY_XML: true }" : ((parsed.exception ? "" : name) + parsed.str)
   if (repeat) str = `DFXS_FLATTEN__${++temp_structs}: [ 'repeat(${min}${min==max ? "" : `,${max}`})': {\n${indent(base_depth)}${str}\n${indent(base_depth-1)}} ]`   
   
   if (recursiv_el !== null) recursiv_el.ref[recursiv_el.key]--
   return str
}

function parseElementAux(el, name, depth, schemaElem) {
   let str = "", exception = false, base_depth = depth + (schemaElem ? 1 : 0)
   let ct = el.content.length > 0 && el.content[0].element == "complexType"
   
   // parsing dos atributos -----
   // se "nillable" for true, dar uma probabilidade de 30% de o conteúdo do elemento no XML ser nil
   if ("nillable" in el.attrs && el.attrs.nillable) {
      str = `if (Math.random() < ${SETTINGS.prob_nil}) { ${name}{ DFXS_ATTR__nil: true } }\n${indent(base_depth)}else {${ct ? "\n"+indent(base_depth+1) : " "}${name}`
      exception = true
   }
   if ("fixed" in el.attrs) return {str: '"' + el.attrs.fixed + '"', exception}
   if ("default" in el.attrs) {
      str = `if (Math.random() < ${SETTINGS.prob_default}) { ${name}"${el.attrs.default}" }\n${indent(base_depth)}else {${ct ? "\n"+indent(base_depth+1) : " "}${name}`
      exception = true
   }

   if ("datagen" in el) str += "'{{" + el.datagen.func + el.datagen.args + "}}'"
   else {
      if ("type" in el.attrs) str += parseType(el.attrs.type, exception ? base_depth : depth)

      // parsing do conteúdo -----
      if (el.content.length > 0) {
         let type = el.content[0] // a parte relevante do simpleType é o elemento filho (list / restriction / union)
         if (type.element == "simpleType") str += parseSimpleType(type, exception ? base_depth : depth)
         if (type.element == "complexType") str += parseComplexType(type, exception ? base_depth+1 : depth)
      }
   }

   if (exception) {
      str += (ct ? "\n"+indent(base_depth) : " ") + "}"
      if (schemaElem) str = `DFXS_TEMP__${++temp_structs}: {\n${indent(base_depth)}${str}\n${indent(depth)}}`
   }
   return {str, exception}
}

function parseRef(el, depth) {
   let ref_el = xsd_content.find(x => x.element == el.element && x.attrs.name == el.attrs.ref)
   ref_el.attrs = {...ref_el.attrs, ...el.attrs}
   delete ref_el.attrs.ref

   switch (el.element) {
      case "element": return parseElement(ref_el, depth, false)
      case "group": return parseGroup(ref_el, depth)
   }
}

function parseType(type, depth) {
   type = getTypeInfo(type)

   if (!type.complex) {
      let st = JSON.parse(JSON.stringify(simpleTypes[type.type]))
      if (!["built_in_base","list","union"].some(x => x in st)) st.built_in_base = type.base
      return parseSimpleType(st, depth)
   }
   return parseComplexType(complexTypes[type.type], depth)
}


// Funções de tradução de complexTypes ----------

function parseComplexType(el, depth) {
   let parsed = {attrs: "", content: ""}
   parsed.attrs = parseAttributeGroup(el, depth+1)

   let content = el.content.filter(x => !x.element.includes("ttribute"))
   let content_len = content.length

   for (let i = 0; i < content_len; i++) {
      switch (content[i].element) {
         case "simpleContent": return parseExtensionSC(content[i].content[0], depth)
         case "group": parsed.content += parseGroup(content[i], depth+1); break;
         case "all": parsed.content += parseAll(content[i], depth+1); break;
         case "sequence": parsed.content += parseSequence(content[i], depth+1); break;
         case "choice": parsed.content += parseChoice(content[i], depth+1); break;
      }

      if (i < content_len - 1) parsed.content += ",\n"
   }

   let str = "{\n"
   let empty = !parsed.attrs.length && !parsed.content.length

   if ("mixed" in el.attrs && el.attrs.mixed) {
      if (!("mixed_type" in el)) str += `${indent(depth+1)}DFXS_MIXED_DEFAULT: true${empty ? "" : ",\n"}`
      else {
         let base_st = el.mixed_type.content[0]
         let mixed_content = parseSimpleType({built_in_base: base_st.built_in_base, content: base_st.content}, depth)
         str += `${indent(depth+1)}DFXS_MIXED_RESTRICTED: ${mixed_content}${empty ? "" : ",\n"}`
      }
   }
   else if (empty) return "{ missing(100) {empty: true} }"

   if (parsed.attrs.length > 0) {
      str += parsed.attrs
      if (parsed.content.length > 0) str += ",\n"
   }
   return str + `${parsed.content}\n${indent(depth)}}`
}

function parseAttribute(el, depth) {
   let str = normalizeName(el.attrs.name, "ATTR__", true), value = ""

   // parsing dos atributos
   if (el.attrs.use == "prohibited") return ""
   if ("fixed" in el.attrs) value = el.attrs.fixed
   if ("default" in el.attrs) value = el.attrs.default

   // se tiver um valor predefinido, verificar se tem "/' dentro para encapsular com o outro
   if (value.length > 0) {
      let qm = chooseQM(value)
      value = qm + value + qm

      if ("default" in el.attrs) str = `if (Math.random() < ${SETTINGS.prob_default}) { ${str}${value} }\n${indent(depth)}else { ${str}`
   }
   
   if (!value.length || "default" in el.attrs) {
      if ("datagen" in el) value = "'{{" + el.datagen.func + el.datagen.args + "}}'"
      else if ("type" in el.attrs) value = parseType(el.attrs.type, depth)
      else value = parseSimpleType(el.content[0], depth)
   }

   return indent(depth) + str + value + ("default" in el.attrs ? " }" : "")
}

function parseAttributeGroup(el, depth) {
   let str = ""

   for (let i = 0; i < el.content.length; i++) {
      let parsed = ""

      switch (el.content[i].element) {
         case "attribute": parsed = parseAttribute(el.content[i], depth); break;
         case "attributeGroup": parsed = parseAttributeGroup(el.content[i], depth); break;
      }
      
      if (parsed.length > 0) str += parsed + ",\n"
   }

   return str.slice(0, -2)
}

function parseExtensionSC(el, depth) {
   let parsed = {attrs: "", content: ""}

   parsed.attrs = parseAttributeGroup(el, depth+1)
   parsed.content = parseType(el.attrs.base, depth+1)

   let str = "{\n"
   if (parsed.attrs.length > 0) {
      str += parsed.attrs
      if (parsed.content.length > 0) str += ",\n"
   }
   else if (parsed.content.length > 0) return parsed.content

   if (parsed.content.length > 0) str += indent(depth+1)
   return `${str}DFXS_SIMPLE_CONTENT: ${parsed.content}\n${indent(depth)}}`
}

function parseGroup(el, depth) {
   if ("ref" in el.attrs) return parseRef(el, depth)

   default_occurs(el.attrs)
   if (el.attrs.maxOccurs == "unbounded") el.attrs.maxOccurs = SETTINGS.unbounded

   // atualizar o mapa de recursividade, se for o caso
   let recursiv_el = null
   if (recursiveEls("group").includes(el.attrs.name)) recursiv_el = {ref: recursiv.group, key: el.attrs.name}

   if (recursiv_el !== null) {
      // se este novo elemento recursivo ultrapassar a recursividade máxima, não produzir
      if (recursiv_el.ref[recursiv_el.key] == SETTINGS.recursion.upper) return ""
      else {
         // se o elemento recursivo ainda não tiver cumprido a recursividade mínima, obrigar que seja produzido
         if (recursiv_el.ref[recursiv_el.key] < SETTINGS.recursion.lower && !el.attrs.minOccurs) el.attrs.minOccurs = 1
         recursiv_el.ref[recursiv_el.key]++ 
      }     
   }

   let str = "", parsed, min = el.attrs.minOccurs, max = el.attrs.maxOccurs, repeat = min!=1 || max!=1
   
   switch (el.content[0].element) {
      case "all":
         parsed = parseAll(el.content[0], depth+3)
         
         if (parsed.length > 0) {
            parsed = parsed.replace(/(^|\n)(\t+)/g, (m,m1,m2) => m1 + indent(m2.length-1)).replace(/\t+}/, (m) => indent(m.length-1) + "}") // ajustar a formatação
            parsed = `${indent(depth+1)}DFXS_TEMP__${++temp_structs}: {\n${parsed}\n${indent(depth+1)}}`
         }
         break;
      case "choice": parsed = parseChoice(el.content[0], depth+1); break;
      case "sequence": parsed = parseSequence(el.content[0], depth+1); break;
   }

   if (parsed.length > 0) str = parsed
   str = `${indent(depth)}DFXS_FLATTEN__${++temp_structs}: [ ${repeat ? `'repeat(${min}${min==max ? "" : `,${max}`})': ` : ""}{\n${str}\n${indent(depth)}} ]`

   if (recursiv_el !== null) recursiv_el.ref[recursiv_el.key]--
   return str
}

function parseAll(el, depth) {
   let elements = el.content.filter(x => x.element == "element")
   let elements_str = [], nr_elems = 0, min = el.attrs.minOccurs
   let str = "", base_depth = depth + (!min ? 1 : 0)

   elements.forEach(x => {
      let parsed = parseElement(x, base_depth+1, false) // dar parse a cada elemento
      if (parsed.length > 0) {
         nr_elems += x.attrs.maxOccurs // contar o nr de elementos total (tendo em conta maxOccurs de cada um)
         elements_str.push(`\n${indent(base_depth+1)}${parsed},`) // dar parse a todos os elementos e guardar as respetivas strings num array
      }
   })
   if (!elements_str.length) return ""

   if (!min) str = `${indent(base_depth-1)}if (Math.random() < ${SETTINGS.prob_noAll}) { missing(100) {empty: true} }\n${indent(base_depth-1)}else {\n`

   // usar a primitiva at_least para randomizar a ordem dos elementos
   str += `${indent(base_depth)}at_least(${nr_elems}) {${elements_str.join("").slice(0, -1)}\n${indent(base_depth)}}`

   if (!min) str += `\n${indent(base_depth-1)}}`
   return str
}

function parseSequence(el, depth) {
   default_occurs(el.attrs)
   if (el.attrs.maxOccurs == "unbounded") el.attrs.maxOccurs = SETTINGS.unbounded

   let min = el.attrs.minOccurs, max = el.attrs.maxOccurs, repeat = min!=1 || max!=1

   let str = parseCT_child_content("", el.content, depth+1).slice(0, -2)
   str = `${indent(depth)}DFXS_FLATTEN__${++temp_structs}: [ ${repeat ? `'repeat(${min}${min==max ? "" : `,${max}`})': ` : ""}{\n${str}\n${indent(depth)}} ]`
   return str
}

function parseChoice(el, depth) {
   default_occurs(el.attrs)
   if (el.attrs.maxOccurs == "unbounded") el.attrs.maxOccurs = SETTINGS.unbounded

   let min = el.attrs.minOccurs, max = el.attrs.maxOccurs, repeat = min!=1 || max!=1
   let str = "", or_str = `${indent(depth+1)}or() {\n`

   // usar a primitiva or para fazer exclusividade mútua
   str = parseCT_child_content(or_str, el.content, depth+2).slice(0, -2) + `\n${indent(depth+1)}}`
   if (/\t+or\(\) \n/.test(str)) return ""
   str = `${indent(depth)}DFXS_FLATTEN__${++temp_structs}: [ ${repeat ? `'repeat(${min}${min==max ? "" : `,${max}`})': ` : ""}{\n${str}\n${indent(depth)}} ]`
   return str
}

function parseCT_child_content(str, content, depth) {
   content.forEach(x => {
      let parsed
      switch (x.element) {
         case "element":
            parsed = parseElement(x, depth, false)
            if (parsed.length > 0) parsed = indent(depth) + parsed
            break
         case "group": parsed = parseGroup(x, depth); break;
         case "sequence": parsed = parseSequence(x, depth); break;
         case "choice": parsed = parseChoice(x, depth); break;
         case "all": parsed = parseAll(x, depth); break;
      }
      if (parsed.length > 0) str += parsed + ",\n"
   })
   
   return str
}


module.exports = { convert }