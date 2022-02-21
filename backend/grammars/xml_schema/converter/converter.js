const {parseSimpleType} = require('./simpleType')

let default_prefix = null
let xsd_content = []
let simpleTypes = {}
let complexTypes = {}
let recursiv = {element: {}, complexType: {}, group: {}}
let settings = {}
let ids = 0

/* nr de elementos que vão ser criados como objetos temporariamente na DSL com uma chave especial 
e convertidos posteriormente para a forma original na tradução JSON-XML do DataGen */
let temp_structs = 0

// Tabs de indentação
const indent = depth => "\t".repeat(depth)
// Escolher uma QM que não seja usada na própria string
const chooseQM = str => str.includes('"') ? "'" : '"'
// Gerar um número aleatório entre min e max (inclusivé)
const randomize = (min, max) => Math.floor(Math.random() * ((max+1) - min) + min)

// criar array com os nomes do tipos embutidos da XML Schema
const built_in_types = () => {
   let types = []
   for (let p in simpleTypes) if (!("built_in_base" in simpleTypes[p])) types.push(p)
   return types
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

function normalizeName(name, end_prefix) {
   let prefix = "DFS_"

   if (/\.|\-/.test(name)) {
      prefix += "NORMALIZED_"
      name = name.replace(/\./g, "__DOT__").replace(/\-/g, "__HYPHEN__")
   }

   return prefix + end_prefix + name + ": "
}


function convert(xsd, st, ct, max_settings) {
   let str = "<!LANGUAGE pt>\n{\n"
   let depth = 1
   
   // variáveis globais
   default_prefix = xsd.prefix
   xsd_content = xsd.content
   simpleTypes = st
   complexTypes = ct
   settings = max_settings
   ids = 0

   let elements = xsd.content.filter(x => x.element == "element")
   if (!elements.length) str += indent(depth) + "DFS_EMPTY_XML: true\n"
   else {
      //for (let i = 0; i < elements.length; i++) {
         let {elem_str, _} = parseElement(elements[0], depth, {}, true)

         if (elem_str.length > 0) {
            str += indent(depth) + elem_str
            //if (i < elements.length-1) str += ","
            str += "\n"
         }
      //}
   }


   str += "}"
   str = str.replace(/{XSD_IDREF}/g, `id{{integer(1,${ids})}}`)
   return str
}

// schemaElem indica se é o <element> é uma coleção ou não
function parseElement(el, depth, keys, schemaElem) {
   if ("ref" in el.attrs) return parseRef(el, depth, keys)

   let elem_str = ""
   let name = el.attrs.name

   // função auxiliar para verificar se o elemento referencia um tipo complexo
   let complexTypeRef = attrs => "type" in attrs && xsd_content.some(x => x.element == "complexType" && x.attrs.name == attrs.type)

   // se ainda não tiver sido gerado nenhum destes elementos, colocar a sua chave no mapa
   // numerar as suas ocorrências para não dar overwrite na geração do DataGen
   // é desnecessário para elementos de schema, que são únicos, mas é para simplificar
   if (!(name in keys)) keys[name] = 1

   if (el.attrs.maxOccurs == "unbounded") el.attrs.maxOccurs = settings.UNBOUNDED
   let occurs = schemaElem ? 1 : randomize(el.attrs.minOccurs, el.attrs.maxOccurs)

   // atualizar o mapa de recursividade deste elemento
   if (name in recursiv.element) recursiv.element[name]++
   else recursiv.element[name] = 1

   // se o elemento tiver um tipo complexo por referência
   if (complexTypeRef(el.attrs)) {
      if (el.attrs.type in recursiv.complexType) recursiv.complexType[el.attrs.type]++
      else recursiv.complexType[el.attrs.type] = 1

      if (recursiv.complexType[el.attrs.type] > settings.RECURSIV.UPPER) occurs = 0
   }
   
   for (let i = 0; i < (recursiv.element[name] > settings.RECURSIV.UPPER ? 0 : occurs); i++) {
      // converte o valor do elemento para string DSL
      let parsed = parseElementAux(el, depth)

      if (!("ref" in el.attrs)) {
         // completa a string DSL com a chave e formatação
         if (!parsed.length) parsed = "{ DFS_EMPTY_XML: true }"
         elem_str += normalizeName(name, keys[name]++ + "__") + parsed + (i < occurs-1 ? `,\n${indent(depth)}` : "")
      }
      else {
         elem_str = parsed.elem_str
         keys = parsed.keys
      }
   }

   recursiv.element[name]--
   if (complexTypeRef(el.attrs)) recursiv.complexType[el.attrs.type]--
   
   return {elem_str, occurs, keys}
}

function parseElementAux(el, depth) {
   let attrs = el.attrs

   // parsing dos atributos -----
   /* if ("abstract" in attrs) */
   if ("nillable" in attrs) {
      // se "nillable" for true, dar uma probabilidade de 30% de o conteúdo do elemento no XML ser nil
      if (attrs.nillable && Math.random() < 0.3) return "{ DFS_ATTR__nil: true }"
   }
   if ("fixed" in attrs) return '"' + attrs.fixed + '"'
   if ("default" in attrs && Math.random() > 0.4) return '"' + attrs.default + '"'
   if ("type" in attrs) return parseType(attrs.type, depth)

   // parsing do conteúdo -----
   let type = el.content[0]
   if (type.element == "simpleType") {
      let parsed = parseSimpleType(type, ids, depth) // a parte relevante do simpleType é o elemento filho (list / restriction / union)
      ids = parsed.ids
      return parsed.str
   }
   else return parseComplexType(type, depth)
}

function parseRef(el, depth, keys) {
   let ref_el = xsd_content.filter(x => x.element == el.element && x.attrs.name == el.attrs.ref)[0]

   ref_el.attrs = {...ref_el.attrs, ...el.attrs}
   delete ref_el.attrs.ref

   switch (el.element) {
      case "element": return parseElement(ref_el, depth, keys, false)
      case "group": return parseGroup(ref_el, depth, keys)
   }
}

function parseType(type, depth) {
   type = getTypeInfo(type)

   if (!type.complex) {
      let st = JSON.parse(JSON.stringify(simpleTypes[type.type]))
      if (!["built_in_base","list","union"].some(x => x in st)) st.built_in_base = type.base

      let parsed = parseSimpleType(st, ids, depth)
      ids = parsed.ids
      return parsed.str
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
         case "group": parsed.content += parseGroup(content[i], depth+1, {}).str.slice(0, -2); break;
         case "all": parsed.content += parseAll(content[i], depth+2, {}).str; break;
         case "sequence": parsed.content += parseSequence(content[i], depth+1, {}).str.slice(0, -1); break;
         case "choice": parsed.content += parseChoice(content[i], depth+1, {}).str; break;
      }

      if (i < content_len - 1) parsed.content += ",\n"
   }

   let str = "{\n"
   let empty = !parsed.attrs.length && !parsed.content.length

   if ("mixed" in el.attrs && el.attrs.mixed) {
      if (!("mixed_type" in el)) str += `${indent(depth+1)}DFS_MIXED_DEFAULT: true${empty ? "" : ",\n"}`
      else {
         let base_st = el.mixed_type.content[0]
         let mixed_content = parseSimpleType({built_in_base: base_st.built_in_base, content: base_st.content}, ids, depth)
         
         ids = mixed_content.ids
         str += `${indent(depth+1)}DFS_MIXED_RESTRICTED: ${mixed_content.str}${empty ? "" : ",\n"}`
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
   let attrs = el.attrs
   let str = normalizeName(attrs.name, "ATTR__"), value = ""

   // parsing dos atributos
   if (attrs.use == "prohibited") return ""
   if ("fixed" in attrs) value = attrs.fixed
   if ("default" in attrs && Math.random() > 0.4) value = attrs.default

   // se tiver um valor predefinido, verifica se tem "/' dentro para encapsular com o outro
   if (value.length > 0) {
      let qm = chooseQM(value)
      return indent(depth) + str + qm + value + qm
   }

   if ("type" in attrs) value = parseType(attrs.type, depth)
   else {
      value = parseSimpleType(el.content[0], ids, depth)
      ids = value.ids
      value = value.str
   }

   return indent(depth) + str + value
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

   parsed.attrs = parseAttributeGroup(el, depth)
   parsed.content = parseType(el.attrs.base, depth)

   let str = "{\n"
   if (parsed.attrs.length > 0) {
      str += parsed.attrs
      if (parsed.content.length > 0) str += ",\n" + indent(depth)
   }
   
   if (parsed.content.startsWith("{DFS_UTILS__")) str += parsed.content.slice(1,-1)
   else str += "DFS_EXTENSION__SC: " + parsed.content

   return str + `\n${indent(depth-1)}}`
}

function parseGroup(el, depth, keys) {
   if ("ref" in el.attrs) return parseRef(el, depth, keys)

   let str = ""
   if (el.attrs.maxOccurs == "unbounded") el.attrs.maxOccurs = settings.UNBOUNDED

   // atualizar o mapa de recursividade deste grupo
   if (el.attrs.name in recursiv.group) recursiv.group[el.attrs.name]++
   else recursiv.group[el.attrs.name] = 1

   let occurs = recursiv.group[el.attrs.name] > settings.RECURSIV.UPPER ? 0 : randomize(el.attrs.minOccurs, el.attrs.maxOccurs)

   // repetir os filhos um nr aleatório de vezes, entre os limites dos atributos max/minOccurs
   for (let i = 0; i < occurs; i++) {
      let parsed

      switch (el.content[0].element) {
         case "all":
            parsed = parseAll(el.content[0], depth+2, keys)
            
            if (parsed.str.length > 0) {
               // ajustar a formatação e remover o \n no fim para meter uma vírgula antes
               parsed.str = parsed.str.replace(/\n\t+/g, "\n" + "\t".repeat(depth+2)).replace(/\t+}/, "\t".repeat(depth+1) + "}")
               parsed.str = `${indent(depth)}DFS_TEMP__${++temp_structs}: {\n${parsed.str}\n${indent(depth)}},`
            }
            break;
         case "choice": parsed = parseChoice(el.content[0], depth, keys); parsed.str += ","; break;
         case "sequence": parsed = parseSequence(el.content[0], depth, keys); break;
      }

      if (parsed.str.length > 0) str += parsed.str + "\n"
      keys = parsed.keys
   }
   
   recursiv.group[el.attrs.name]--
   return {str, keys}
}

function parseAll(el, depth, keys) {
   let elements = el.content.filter(x => x.element == "element")
   let elements_str = [], nr_elems = 0

   elements.forEach(x => {
      // se ainda não tiver sido gerado nenhum destes elementos, colocar a sua chave no mapa
      if (!(x.attrs.name in keys)) keys[x.attrs.name] = 1

      // dar parse a cada elemento
      let parsed = parseElement(x, depth, keys, false)

      if (parsed.elem_str.length > 0) {
         // contar o nr de elementos total (tendo em conta max/minOccurs de cada um)
         nr_elems += parsed.occurs
         keys = parsed.keys

         // dar parse a todos os elementos e guardar as respetivas strings num array
         elements_str.push(`\n${indent(depth)}${parsed.elem_str},`)
      }
   })

   // usar a primitiva at_least para randomizar a ordem dos elementos
   let str = `${indent(depth-1)}at_least(${nr_elems}) {`
   if (elements_str.length > 0) str += elements_str.join("").slice(0, -1)
   else str += `\n${indent(depth)}empty: true` // se o conteúdo for vazio, colocar uma propriedade filler para usar o missing(100)
   str += `\n${indent(depth-1)}}`

   // se minOccurs = 0, dar uma probabilidade de 30% de o elemento não aparecer no XML
   if (!elements_str.length || !el.attrs.minOccurs && Math.random() < 0.3) str = str.replace(/at_least\(\d+\)/, "missing(100)")

   return {str, keys}
}

function parseSequence(el, depth, keys) {
   let str = ""
   if (el.attrs.maxOccurs == "unbounded") el.attrs.maxOccurs = settings.UNBOUNDED

   // repetir os filhos um nr aleatório de vezes, entre os limites dos atributos max/minOccurs
   for (let i = 0; i < randomize(el.attrs.minOccurs, el.attrs.maxOccurs); i++) {
      let parsed = parseCT_child_content(el.element, str, el.content, depth, keys)

      str = parsed.str
      keys = parsed.keys
   }

   return {str: str.slice(0, -1), keys}
}

function parseChoice(el, depth, keys) {
   let str = ""
   if (el.attrs.maxOccurs == "unbounded") el.attrs.maxOccurs = settings.UNBOUNDED

   // escolher um dos filhos um nº aleatório de vezes, entre os limites dos atributos max/minOccurs
   for (let i = 0; i < randomize(el.attrs.minOccurs, el.attrs.maxOccurs); i++) {
      // usar a primitiva or para fazer exclusividade mútua
      let new_str = `${indent(depth++)}or() {\n`

      let parsed = parseCT_child_content(el.element, new_str, el.content, depth, keys)
      keys = parsed.keys

      if (parsed.str != new_str) {
         new_str = parsed.str.slice(0, -2) + `\n${indent(--depth)}},\n`
         str += new_str
      }
   }

   return {str: str.slice(0, -2), keys}
}

function parseCT_child_content(parent, str, content, depth, keys) {
   // a var choice é para indicar se o último elemento filtrado foi uma choice
   let choice
   
   content.forEach(x => {
      let parsed
      choice = false

      // na string de um <element>, é preciso por tabs e vírgula
      if (x.element == "element") {
         // se ainda não tiver sido gerado nenhum destes elementos, colocar a sua chave no mapa
         if (!(x.attrs.name in keys)) keys[x.attrs.name] = 1

         parsed = parseElement(x, depth, keys, false)
         if (parsed.elem_str.length > 0) str += `${indent(depth)}${parsed.elem_str},\n`
      }

      if (x.element == "group") {
         parsed = parseGroup(x, depth, keys)
         if (parsed.str.length > 0) str += parsed.str
      }

      // a string de uma <sequence> já vem formatada
      if (x.element == "sequence") {
         parsed = parseSequence(x, depth, keys)

         if (parsed.str.length > 0) {
            if (parent == "choice") {
               // para uma sequence dentro de uma choice, queremos escolher a sequência inteira e não apenas um dos seus elementos
               // por isso, cria-se um objeto na DSL com uma chave especial que posteriormente é removido na tradução para XML
               parsed.str = "\t" + parsed.str.replace(/\n\t/g, "\n\t\t").slice(0, -1)
               str += `${indent(depth)}DFS_TEMP__${++temp_structs}: {\n${parsed.str}\n${indent(depth)}},\n`
            }
            else str += parsed.str + "\n"
         }
      }

      // a string de uma <choice> já vem formatada
      if (x.element == "choice") {
         parsed = parseChoice(x, depth, keys)
         if (parsed.str.length > 0) str += parsed.str + ",\n"
         choice = true
      }

      if (x.element == "all") {
         parsed = parseAll(x, depth, keys)
         if (parsed.str.length > 0) str += parsed.str + ",\n"
      }

      keys = parsed.keys
   })

   return {str, choice, keys}
}


module.exports = { convert }