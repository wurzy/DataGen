// Funções auxiliares ----------

// retornar erro
const error = msg => {return {error: msg}}
// retorna dados encapsulados, se não houver nenhum erro
const data = x => {return {data: x}}
// se for null, converte para array vazio; senão, remove os nulls do array
const cleanContent = content => content === null ? [] : content.filter(e => e !== null)
// juntar todos os atributos do elemento num só objeto
const getAttrs = objArr => objArr === null ? {} : cleanContent(objArr).reduce(((r,c) => { r[c.attr] = c.val; return r }), {})
// verificar se o array de atributos tem algum atributo repetido
const check_repeatedAttrs = (arr, attrs, el_name) => (Object.keys(attrs).length == arr.length) ? attrs : error(`O elemento <b>&#60;${el_name}&#62;</b> não pode possuir atributos repetidos!`)

// mensagem de erro para quando o atributo 'name'/'ref' é obrigatório
let required_err = (attr, el, kind) => `O atributo <b>name</b> é requirido num elemento <b>&#60;${el}&#62;</b>${kind}! O nome do elemento deve obeceder à expressão regular <b>[a-zA-Z_][a-zA-Z0-9.\-_]*</b>, podendo também conter caracteres não-ASCII${attr=="ref" ? ", e pode ter ainda um prefixo de schema (que deve ter a mesma semântica)" : ""}.`

// adicionar os valores default dos atributos "max/minOccurs"
function defaultOccurs(attrs, curr) {
  // os filhos de um group (all/choice/sequence) não podem possuir estes atributos, logo não colocar por default
  // mas os <element> dentro dos filhos podem
  if (!curr.group || curr.element) {
    if (!("maxOccurs" in attrs)) attrs.maxOccurs = ("minOccurs" in attrs && attrs.minOccurs > 0) ? attrs.minOccurs : 1
    if (!("minOccurs" in attrs)) attrs.minOccurs = !attrs.maxOccurs ? 0 : 1
  }
  return attrs
}


// Funções de verificação de atributos ----------

// validar os atributos do elemento <schema>
function check_schemaAttrs(arr, default_prefix) {
    // obrigatoriamente tem atributos (no mínimo a definição do namespace)
    if (arr.length < 1) return error("O elemento <b>&#60;schema&#62;</b> requer, no mínimo, a definição do namespace!")

    let keys = [], // array com os nomes dos atributos
        attrs = {namespaces: {}}, // objeto com os valores dos atributos
        null_namespace = "" // para guardar o URI do namespace predefinido, caso não tenha prefixo
        
    for (let i = 0; i < arr.length; i++) {
      // verificar que não há atributos repetidos (pode haver várias definições de namespaces)
      if (keys.includes(arr[i].attr) && arr[i].attr != "namespace") return error("O elemento <b>&#60;schema&#62;</b> não pode possuir atributos repetidos!")
      else {
        // guardar a chave "namespace" apenas 1x
        if (!keys.includes(arr[i].attr)) keys.push(arr[i].attr)
        // guardar o valor no objeto attrs
        if (arr[i].attr == "namespace") {
          if (arr[i].prefix === null) {
            // verificar que só há, no máximo, 1 namespace sem prefixo
            if (null_namespace.length > 0) return error("Não pode haver vários namespaces sem prefixo associado!")
            else null_namespace = arr[i].val
          }
          else {
            // verificar que não há prefixos de namespaces repetidos
            if (arr[i].prefix in attrs.namespaces) return error("Todos os prefixos de namespaces devem ser únicos!")
            else attrs.namespaces[arr[i].prefix] = arr[i].val
          }
        }
        else attrs[arr[i].attr] = arr[i].val
      }
    }

    // a definição do namespace é obrigatória
    if (!Object.keys(attrs.namespaces).length && !null_namespace.length) return error("O elemento <b>&#60;schema&#62;</b> requer a definição do namespace!")
    // verificar que a definição de um namespace e, opcionalmente, prefixo predefinidos está correta e coerente
    if (default_prefix === null && !null_namespace.length) return error("Precisa de prefixar o elemento <b>&#60;schema&#62;</b> com o prefixo do namespace predefinido!")
    if (default_prefix !== null && null_namespace.length > 0) {
      if (!(default_prefix in attrs.namespaces)) return error("Precisa de associar o prefixo do elemento <b>&#60;schema&#62;</b> a um namespace!")
    }

    // atributos com valores predefinidos
    if (!keys.includes("attributeFormDefault")) attrs.attributeFormDefault = "unqualified"
    if (!keys.includes("elementFormDefault")) attrs.elementFormDefault = "unqualified"

    return data(attrs)
}

// validar os atributos de um elemento <element>
function check_elemAttrs(arr, schema_depth, curr) {
  let attrs = check_repeatedAttrs(arr, getAttrs(arr), "element")
  if ("error" in attrs) return attrs

  // restrições relativas à profundidade dos elementos
  if (!schema_depth) { // elementos da schema
    if ("ref" in attrs) return error("O atributo <b>ref</b> é proibido num elemento <b>&#60;element&#62;</b> de schema!")
    if ("maxOccurs" in attrs) return error("O atributo <b>maxOccurs</b> é proibido num elemento <b>&#60;element&#62;</b> de schema!")
    if ("minOccurs" in attrs) return error("O atributo <b>minOccurs</b> é proibido num elemento <b>&#60;element&#62;</b> de schema!")
    if (!("name" in attrs)) return error(required_err("name", "element", " de schema"))
  }
  // elementos aninhados
  else if ("final" in attrs) return error("O atributo <b>final</b> é proibido num elemento <b>&#60;element&#62;</b> local!")

  // mensagem de erro de atributos mutuamente exclusivos
  let mutexc_error = (a1,a2) => error(`Em elementos <b>&#60;element&#62;</b>, os atributos <b>${a1}</b> e <b>${a2}</b> são mutuamente exclusivos!`)
  // atributos mutuamente exclusivos
  if ("default" in attrs && "fixed" in attrs) return mutexc_error("default","fixed")
  if ("ref" in attrs && "block" in attrs) return mutexc_error("ref","block")
  if ("ref" in attrs && "default" in attrs) return mutexc_error("ref","default")
  if ("ref" in attrs && "fixed" in attrs) return mutexc_error("ref","fixed")
  if ("ref" in attrs && "form" in attrs) return mutexc_error("ref","form")
  if ("ref" in attrs && "name" in attrs) return mutexc_error("ref","name")
  if ("ref" in attrs && "nillable" in attrs) return mutexc_error("ref","nillable")
  if ("ref" in attrs && "type" in attrs) return mutexc_error("ref","type")

  // maxOccurs não pode ser inferior a minOccurs
  if ("maxOccurs" in attrs && "minOccurs" in attrs && attrs.maxOccurs < attrs.minOccurs)
    return error("A propriedade <b>maxOccurs</b> do elemento não pode ser inferior à <b>minOccurs</b>!")

  // atributos com valores predefinidos
  if (schema_depth > 0) attrs = defaultOccurs(attrs, curr)
  if (!("abstract" in attrs)) attrs.abstract = false
  //if (!("form" in attrs)) attrs.form = //valor do atributo elementFormDefault do elemento da schema
  if (!("nillable" in attrs)) attrs.nillable = false

  return data(attrs)
}

// validar os atributos de um elemento <keyref>
function check_keyrefAttrs(arr) {
  let attrs = check_repeatedAttrs(arr, getAttrs(arr), "keyref")
  if ("error" in attrs) return attrs

  // atributos requiridos
  if (!("name" in attrs)) return error(required_err("name", "keyref", ""))
  if (!("refer" in attrs)) return error(`No elemento <b>&#60;keyref&#62;</b> é requirido o atributo <b>refer</b>!`)

  return data(attrs)
}

// validar os atributos de um elemento <attribute/attributeGroup>
function check_attributeElAttrs(arr, el_name, schema_depth) {
  let attrs = check_repeatedAttrs(arr, getAttrs(arr), el_name)
  if ("error" in attrs) return attrs

  // restrições relativas à profundidade dos elementos
  if (!schema_depth) { // elementos da schema
    if ("ref" in attrs) return error(`O atributo <b>ref</b> é proibido num elemento <b>&#60;${el_name}&#62;</b> de schema!`)
    if (!("name" in attrs)) return error(required_err("name", el_name, " de schema"))
  }
  else {
    if (el_name == "attributeGroup") {
      if (!("ref" in attrs)) return error(required_err("ref", el_name, " local"))
      if ("name" in attrs) return error(`O atributo <b>name</b> é proibido num elemento <b>&#60;${el_name}&#62;</b> local!`)
    }
  }

  // mensagem de erro de atributos mutuamente exclusivos
  let mutexc_error = (a1,a2) => error(`Em elementos <b>&#60;${el_name}&#62;</b>, os atributos <b>${a1}</b> e <b>${a2}</b> são mutuamente exclusivos!`)
  // atributos mutuamente exclusivos
  if ("name" in attrs && "ref" in attrs) return mutexc_error("name","ref")

  if (el_name == "attribute") {
    if ("default" in attrs && "fixed" in attrs) return mutexc_error("default","fixed")
    if ("ref" in attrs && "form" in attrs) return mutexc_error("ref","form")
    if ("ref" in attrs && "type" in attrs) return mutexc_error("ref","type")

    // atributos com valores predefinidos
    if (!("use" in attrs)) attrs.use = "optional"
  }

  return data(attrs)
}

// validar os atributos de um elemento <group>
function check_groupAttrs(arr, schema_depth, curr) {
  let attrs = check_repeatedAttrs(arr, getAttrs(arr), "group")
  if ("error" in attrs) return attrs

  // restrições relativas à profundidade dos elementos
  if (!schema_depth) { // elementos da schema
    if ("ref" in attrs) return error("O atributo <b>ref</b> é proibido num elemento <b>&#60;group&#62;</b> de schema!")
    if ("minOccurs" in attrs) return error("O atributo <b>minOccurs</b> é proibido num elemento <b>&#60;group&#62;</b> de schema!")
    if ("maxOccurs" in attrs) return error("O atributo <b>maxOccurs</b> é proibido num elemento <b>&#60;group&#62;</b> de schema!")
    if (!("name" in attrs)) return error(required_err("name", "group", " de schema"))
  }
  else {
    if (!("ref" in attrs)) return error(required_err("ref", "group", " local"))
    if ("name" in attrs) return error("O atributo <b>name</b> é proibido num elemento <b>&#60;group&#62;</b> local!")
  }

  // atributos com valores predefinidos
  return data(!schema_depth ? attrs : defaultOccurs(attrs, curr))
}

// validar os atributos de um elemento <notation>
function check_notationAttrs(arr) {
  let attrs = check_repeatedAttrs(arr, getAttrs(arr), "notation")
  if ("error" in attrs) return attrs

  // atributos requiridos
  if (!("name" in attrs)) return error(required_err("name", "notation", ""))
  if (!("public" in attrs) && !("system" in attrs)) return error(`No elemento <b>&#60;notation&#62;</b> é requirido pelo menos um dos atributos <b>public</b> e <b>system</b>!`)

  return data(attrs)
}
  
// validar os atributos de um elemento <simpleType/complexType>
function check_localTypeAttrs(arr, el_name, schema_depth, curr) {
  let attrs = check_repeatedAttrs(arr, getAttrs(arr), el_name)
  if ("error" in attrs) return attrs
  
  // restrições relativas à profundidade dos elementos
  if (!schema_depth && !("name" in attrs)) return error(required_err("name", el_name, " de schema"))
  if (schema_depth && !curr.redefine && "name" in attrs) return error(`O atributo <b>name</b> é proibido se o pai do elemento <b>&#60;${el_name}&#62;</b> não for o <b>&#60;schema&#62;</b>!`)

  if (el_name == "complexType") {
    // atributos com valores predefinidos
    if (!("abstract" in attrs)) attrs.abstract = false
    if (!("mixed" in attrs)) attrs.mixed = false
  }

  return data(attrs)
}

// verificar que o nome do elemento de derivação, os atributos e o valor batem todos certo
// nesta função, só se verifica o espaço léxico do atributo "value" dos elementos <totalDigits>, <fractionDigits>, <length>, <minLength>, <maxLength>, <whiteSpace> e <pattern>
// para verificar os restantes elementos, é preciso o tipo-base, faz-se mais à frente
function check_constrFacetAttrs(name, arr) {
    let attrs = check_repeatedAttrs(arr, getAttrs(arr), name)
    if ("error" in attrs) return attrs

    if ("value" in attrs) {
      if (name == "whiteSpace") {
        if (!["preserve","replace","collapse"].includes(attrs.value)) return error(`O valor da faceta <b>&#60;whiteSpace&#62;</b> deve ser um dos seguintes: {<b>preserve</b>, <b>replace</b>, <b>collapse</b>}!`)
      }
      else if (name == "totalDigits") {
        if (!/^\+?[1-9]\d*$/.test(attrs.value)) return error(`O valor da faceta <b>totalDigits</b> deve ser um inteiro positivo!`)
        attrs.value = parseInt(attrs.value)
      } 
      else if (["fractionDigits","length","minLength","maxLength"].includes(name)) {
        if (!/^\+?\d+$/.test(attrs.value)) return error(`O valor da faceta <b>&#60;${name}&#62;</b> deve ser um inteiro não negativo!`)
        attrs.value = parseInt(attrs.value)
      }
    }

    // restrições relativas à existência dos atributos
    if (!("value" in attrs)) return error(`No elemento <b>&#60;${name}&#62;</b> é requirido o atributo <b>value</b>!`)
    if (name == "pattern" || name == "enumeration") {
      if ("fixed" in attrs) return error(`O elemento <b>&#60;${name}&#62;</b> não aceita o atributo <b>fixed</b>!`)
    }
    else if (!("fixed" in attrs)) attrs.fixed = false
    
    return data(attrs)
}

// adicionar um grupo novo à estrutura attrGroups
function addAttrGroup(attrGroups, name, el, content) {
  if (name === null) {
    let i = 1
    while (i in attrGroups) {i++}
    name = i
  }

  attrGroups[name] = {element: el, attrs: [], groups: []}
  content.forEach(x => {
    if (x.element == "attribute") attrGroups[name].attrs.push(x.attrs["name" in x.attrs ? "name" : "ref"])
    if (x.element == "attributeGroup") attrGroups[name].groups.push(x.attrs.ref)
  })

  return attrGroups
}

// verificar que um elemento com atributos não tem atributos repetidos
function check_repeatedAttributes(attrGroups) {
  let parsed_groups = {}

  while (Object.keys(attrGroups).length > 0) {
    let next_groups = {}
    for (let x in attrGroups) {
      if (attrGroups[x].groups.every(g => g in parsed_groups)) next_groups[x] = attrGroups[x]
    }

    let k = Object.keys(next_groups).reverse()
    
    for (let i = 0; i < k.length; i++) {
      let new_attrs = next_groups[k[i]].groups.map(g => parsed_groups[g]).flat()
      let repeated = next_groups[k[i]].attrs.filter(v => new_attrs.includes(v))
      
      if (repeated.length > 0) {
        let name = isNaN(parseInt(k[i])) ? `<i>${k[i]}</i>` : "novo"
        return error(`Os elementos <b>&#60;attribute&#62;</b> locais de um elemento devem ter todos nomes distintos entre si! Neste caso, o <b>&#60;${attrGroups[k[i]].element}&#62;</b> ${name} tem atributos repetidos com os nomes <i>${repeated.join("</i>, <i>")}</i>.`)
      }
      else {
        next_groups[k[i]].attrs = next_groups[k[i]].attrs.concat(new_attrs)
        parsed_groups[k[i]] = next_groups[k[i]].attrs
        delete attrGroups[k[i]]
      }
    }
  }

  return data(true)
}

module.exports = {
  defaultOccurs,
  check_schemaAttrs,
  check_elemAttrs,
  check_keyrefAttrs,
  check_attributeElAttrs,
  check_groupAttrs,
  check_notationAttrs,
  check_localTypeAttrs,
  check_constrFacetAttrs,
  addAttrGroup,
  check_repeatedAttributes
}