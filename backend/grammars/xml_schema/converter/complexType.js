// Funções auxiliares ----------

/* nr de elementos que vão ser criados como objetos temporariamente na DSL com uma chave especial 
e convertidos posteriormente para a forma original na tradução JSON-XML do DataGen */
let temp_structs = 0

// Escolher uma QM que não seja usada na própria string
const chooseQM = str => str.includes('"') ? "'" : '"'
// Gerar um número aleatório entre min e max (inclusivé)
const randomize = (min, max) => Math.floor(Math.random() * ((max+1) - min) + min)


// Funções de tradução de complexTypes ----------

function parseComplexType(el, depth) {
    let parsed = {attrs: "", content: ""}
 
    parsed.attrs = parseAttributeGroup(el, depth+1)
 
    for (let i = 0; i < el.content.length; i++) {
       switch (el.content[i].element) {
          case "group": parsed.content = parseGroup(el.content[i], depth+1, {}).str.slice(0, -2); break;
          case "all": parsed.content = parseAll(el.content[i], depth+2, {}).str; break;
          case "sequence": parsed.content = parseSequence(el.content[i], depth+1, {}).str.slice(0, -1); break;
          case "choice": parsed.content = parseChoice(el.content[i], depth+1, {}).str; break;
       }
    }
    
    if (!parsed.attrs.length && !parsed.content.length) return "{ missing(100) {empty: true} }"
 
    let str = "{\n"
    if (parsed.attrs.length > 0) str += parsed.attrs + ",\n"
    return str + `${parsed.content}\n${indent(depth)}}`
}
 
function parseAttribute(el, depth) {
    let attrs = el.attrs
    let str = `DFXS_ATTR__${attrs.name}: `, value = ""
 
    // parsing dos atributos -----
    if (attrs.use == "prohibited") return ""
    if ("fixed" in attrs) value = attrs.fixed
    if ("default" in attrs) value = attrs.default
 
    // se tiver um valor predefinido, verifica se tem "/' dentro para encapsular com o outro
    if (value.length > 0) {
       let qm = chooseQM(value)
       return indent(depth) + str + qm + value + qm
    }
 
    if ("type" in attrs) value = parseType(attrs.type)
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
 
function parseGroup(el, depth, keys) {
    let str = ""
 
    // repetir os filhos um nr aleatório de vezes, entre os limites dos atributos max/minOccurs
    for (let i = 0; i < randomize(el.attrs.minOccurs, el.attrs.maxOccurs); i++) {
       let parsed
 
       switch (el.content[0].element) {
          case "all":
             parsed = parseAll(el.content[0], depth+2, keys)
             
             if (parsed.str.length > 0) {
                // ajustar a formatação e remover o \n no fim para meter uma vírgula antes
                parsed.str = parsed.str.replace(/\n\t+/g, "\n" + "\t".repeat(depth+2)).replace(/\t+}/, "\t".repeat(depth+1) + "}")
                parsed.str = `${indent(depth)}DFXS_TEMP__${++temp_structs}: {\n${parsed.str}\n${indent(depth)}},`
             }
             break;
          case "choice": parsed = parseChoice(el.content[0], depth, keys); parsed.str += ","; break;
          case "sequence": parsed = parseSequence(el.content[0], depth, keys); break;
       }
 
       if (parsed.str.length > 0) str += parsed.str + "\n"
       keys = parsed.keys
    }
 
    return {str, keys}
}
 
function parseAll(el, depth, keys) {
    let elements = el.content.filter(x => x.element == "element")
    let elements_str = [], nr_elems = 0
 
    elements.forEach(x => {
       // se ainda não tiver sido gerado nenhum destes elementos, colocar a sua chave no mapa
       if (!(x.attrs.name in keys)) keys[x.attrs.name] = 1
 
       // dar parse a cada elemento
       let parsed = parseElement(x, depth, keys)
 
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
 
    // escolher um dos filhos um nº aleatório de vezes, entre os limites dos atributos max/minOccurs
    for (let i = 0; i < randomize(el.attrs.minOccurs, el.attrs.maxOccurs); i++) {
       // usar a primitiva or para fazer exclusividade mútua
       str += `${indent(depth++)}or() {\n`
 
       let parsed = parseCT_child_content(el.element, str, el.content, depth, keys)
       keys = parsed.keys
 
       str = parsed.str.slice(0, -2) + `\n${indent(--depth)}},\n`
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
 
          parsed = parseElement(x, depth, keys)
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
                str += `${indent(depth)}DFXS_TEMP__${++temp_structs}: {\n${parsed.str}\n${indent(depth)}},\n`
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
 
       keys = parsed.keys
    })
 
    return {str, choice, keys}
}


module.exports = { parseComplexType }