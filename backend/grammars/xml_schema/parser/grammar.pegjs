// Gramática de XML Schema para "DataGen from Schemas" -----

{
  // Variáveis gerais ------------------------------

  // queue para invocações de funções de validação de referências na schema (refs e types) - para os elementos referenciados não terem de aparecer antes das referências
  let queue = []
  // queue para invocações de funções relacionadas com definição e restrição de simpleTypes
  let st_queue = {simpleTypes: [], restrictions: []}
  // queue para invocações de funções relacionadas com definição de complexTypes
  let ct_queue = {extension: [], restriction: []}
  // prefixo definido na declaração da schema
  let default_prefix = null
  // prefixos associados ao targetNamespace (declarações locais da schema) - teoricamente é só um, mas isto é para lidar com o erro, caso o user declare 2+ prefixos para este namespace
  let target_prefixes = []
  // prefixos de namespaces declarados na schema
	let prefixes = []
  // número de elementos aninhados dentro do <schema> correntemente
  let schema_depth = 0
  // nomes (únicos) dos elementos globais com esse atributo
  let names = {attribute: [], attributeGroup: [], element: [], elem_constraint: [], group: [], notation: []}
  // atributos "id" de elementos da schema - têm de ser únicos
  let ids = []
  // número de elementos com tipo ID(REF), para determinar se a referenciação é válida
  let id_types = {ID: 0, IDREF: 0, IDREFS: 0}
  // array com os valores dos atributos 'minOccurs' que coexistem com 'maxOccurs' = "unbounded"
  let unbounded_min = []
  // boleanos para saber se está a ser processado um <element> (para a função validationQueue.type), um <group> ou um <redefine>
  let curr = {element: false, group: false, redefine: false}
  // nomes dos atributos presentes dentro de cada attributeGroup correspondente
  let attrGroups = {}
  
  
  // Variáveis relacionadas com tipos ------------------------------

  // verificar se o resultado de uma função invocada de uma API vem com erro ou não 
  const checkError = obj => ("error" in obj) ? error(obj.error) : obj.data

  // array dos tipos embutidos da XML Schema e posteriores simpleTypes criados a partir deles, em formato da DSL ({element, attrs, content})
  let simpleTypes = stAPI.create_simpleTypes(default_prefix)
  // array dos complexTypes criados na schema
  let complexTypes = {}
  // número de simple/complexTypes aninhados correntemente
  let type_depth = 0
  // nome do simple/complexType a ser processado neste momento
  let current_type = null
  // nomes dos novos tipos definidos na schema - têm de ser únicos
  let local_types = {simpleType: [], complexType: [], simpleContent: []}
  // boleano para indicar se um tipo referenciado tem de corresponder a um tipo built-in ou simpleType apenas (false), ou pode ser um complexType também (true) 
  let any_type = "BSC"
  // número de simpleTypes sem nome criados na schema, para guardar referência na st_queue
  let noNameST = 0
  // correspondência entre o nome que o user dá a tipos locais com o mesmo nome de tipos embutidos e os nomes com que são guardados em execução
  let modTypeNames = {}

  
  // Funções auxiliares gerais ------------------------------

  // verificar se o elemento pai é o <schema>
  const atRoot = () => !schema_depth
  // verificar se não foi definido um prefixo para a schema
  const noSchemaPrefix = () => default_prefix === null
  // verificar se o prefixo usado foi declarado na definição da schema
  const existsPrefix = p => prefixes.includes(p) ? p : error(`O prefixo <b>${p}</b> não foi declarado no início da schema!`)
  // verificar se as aspas/apóstrofes são fechados consistentemente - se sim, retorna o objeto {attr,val} em que foram usadas (ou apenas true, para as invocações da declaração XML)
  const checkQM = (q1,q2,attr,val) => q1 === q2 ? (attr===null ? true : {attr,val}) : error("Deve encapsular o valor em aspas ou em apóstrofes. Não pode usar um de cada!")
  // executar todas as invocações guardadas na queue para ver se são válidas
  const checkQueue = () => queue.reduce((accum, curr) => accum && queueFuncs[curr.attr](...curr.args), true)
  // se for null, converte para array vazio; senão, remove os nulls do array
  const cleanContent = content => content === null ? [] : content.filter(e => e !== null)

  // verificar todas as definições e restrições de simpleTypes colocadas na st_queue
  const check_stQueue = () => {
    let parsed_types = stAPI.built_in_types(simpleTypes)
    let complex_types = Object.keys(complexTypes)

    let complexOnlyQ = arr => arr.every(x => "complex" in x)
    let filter_aux = arr => arr.reduce((a,c) => a && parsed_types.includes(c), true)
    let complexFilter_aux = (x, base) => "complex" in x && complex_types.includes(base)

    while (st_queue.restrictions.length > 0 || st_queue.simpleTypes.length > 0) {
      let r = st_queue.restrictions.filter(x => parsed_types.includes(x.base) || complexFilter_aux(x, x.base))
      st_queue.restrictions = st_queue.restrictions.filter(x => !(parsed_types.includes(x.base) || complexFilter_aux(x, x.base)))

      let st = st_queue.simpleTypes.filter(x => filter_aux(x.info.base) || complexFilter_aux(x, x.info.base[0]))
      st_queue.simpleTypes = st_queue.simpleTypes.filter(x => !(filter_aux(x.info.base) || complexFilter_aux(x, x.info.base[0])))

      // dar uma mensagem de erro se estiver a ser referenciado algum tipo inválido
      if (!r.length && !st.length) {
        if (st_queue.restrictions.length > 0 || st_queue.simpleTypes.length > 0) {
          // já só há complexTypes na queue que ainda precisam de ser processados na ct_queue
          if (complexOnlyQ(st_queue.restrictions) && complexOnlyQ(st_queue.simpleTypes)) break
        }

        r = st_queue.restrictions.filter(x => x.args[0] !== undefined)
        let lists = st_queue.simpleTypes.filter(x => x.args[1][0].element == "list" && "itemType" in x.args[1][0].attrs)
        let unions = st_queue.simpleTypes.filter(x => x.args[1][0].element == "union" && "memberTypes" in x.args[1][0].attrs)

        lists = lists.filter(x => !parsed_types.includes(x.args[1][0].attrs.itemType))
        unions = unions.filter((x,i) => {
          unions[i].args[1][0].attrs.memberTypes = unions[i].args[1][0].attrs.memberTypes.filter(t => !parsed_types.includes(t))
          return unions[i].args[1][0].attrs.memberTypes.length > 0
        })

        let ws = "‏‏‎ ‎"
        let r_error = `${ws}${ws}- algum dos tipos {<b>${r.map(x => x.base).join("</b>, <b>")}</b>} referenciados no atributo <b>base</b> dos elementos <b>&#60;restriction&#62;</b> (simpleType)`
        let l_error = `${ws}${ws}- algum dos tipos {<b>${lists.map(x => x.args[1][0].attrs.itemType).join("</b>, <b>")}</b>} referenciados no atributo <b>itemType</b> dos elementos <b>&#60;list&#62;</b>`
        let u_error = `${ws}${ws}- algum dos tipos {<b>${unions.map(x => x.args[1][0].attrs.memberTypes.join("</b>, <b>")).join(", ")}</b>} referenciados no atributo <b>memberTypes</b> dos elementos <b>&#60;union&#62;</b>`

        let err = "Existe uma referência a um tipo inválido que é:<br>"
        if (r.length > 0) err += r_error
        if (lists.length > 0) err += (err[err.length-1] == "<br>" ? "" : ";<br>") + l_error
        if (unions.length > 0) err += (err[err.length-1] == "<br>" ? "" : ";<br>") + u_error

        return error(err + ".")
      }
      
      r.map(x => {
        let arg_base = x.args[0], content = x.args[1]
        let base, union = false

        if (arg_base !== undefined) {
          base = arg_base
          let base_st 
          
          if (x.base in simpleTypes) base_st = simpleTypes[x.base]
          else if ("complex" in x) {
            base = complexTypes[x.base].content[0].content[0].attrs.base
            base_st = simpleTypes[base]
          }
          
          if ("built_in_base" in base_st && stAPI.isObject(base_st.built_in_base) && "union" in base_st.built_in_base) base = base_st.built_in_base
          if ("union" in base_st) union = true
        }
        else {
          if ("list" in content[0]) base = {list: true}
          else if ("union" in content[0])  union = true
          else if (stAPI.isObject(content[0].built_in_base) && "union" in content[0].built_in_base) base = content[0].built_in_base
          else base = content[0].built_in_base
        }
        
        // quando é restrição a uma union, não precisa de verificar as facetas aqui porque o faz depois, numa função específica para unions
        if (union) x.ref.content = content
        else x.ref.content = checkError(stAPI.check_restrictionST_facets(x.parent, base, content, default_prefix, simpleTypes))
      })

      st.map(x => {
        let name = x.args[0], content = x.args[1]
        let extension_content = []

        if ("complex" in x) {          
          if (content[0].attrs.base in complexTypes) {
            let base_extension = complexTypes[content[0].attrs.base].content[0].content[0]
            content[0].attrs.base = base_extension.attrs.base
            extension_content = base_extension.content
          }

          let new_attrs = content[0].content.filter(x => x.element.includes("attribute"))
          content[0].content = content[0].content.filter(x => !x.element.includes("attribute"))

          extension_content = checkError(ctAPI.validateRestrictionAttrsSC(x.complex.attrs, extension_content, new_attrs))
        }
        let parsed = checkError(stAPI.restrict(name, content, default_prefix, simpleTypes))
        
        parsed = JSON.parse(JSON.stringify(parsed))
        if (name !== undefined) simpleTypes[name] = parsed

        if (!("complex" in x)) Object.assign(x.ref, parsed)
        else {
          let restricted_ST = "" + ++noNameST
          simpleTypes[restricted_ST] = parsed
          parsed_types.push(restricted_ST)

          x.complex.content[0].content = [{
            element: "extension",
            attrs: {base: restricted_ST},
            content: extension_content
          }]
          
          if ("name" in x.complex.attrs) {
            complexTypes[x.complex.attrs.name] = JSON.parse(JSON.stringify(x.complex))
            complex_types.push(x.complex.attrs.name)
          }
        }
        
        parsed_types.push(x.info.name)
      })
    }

    return true
  }

  const check_ctQueue = () => {
    let getBase = ct => ct.content[0].content[0].attrs.base
    // feito à preguiçoso, só funciona para schema local!
    let splitBase = base => base.includes(":") ? base.split(":")[1] : base
    // verifica se o simpleType já foi processado ou não
    let parsedST = content => ["built_in_base","list","union"].some(y => y in content)

    let simple_types = Object.keys(simpleTypes)
    let init_extensions = ct_queue.extension.length

    // remover da queue de extensões os complexType com base em simpleTypes
    ct_queue.extension = ct_queue.extension.filter(x => {
      let base = splitBase(getBase(x))

      if (simple_types.includes(base)) {
        x.content[0].content[0].attrs.base = base
        if ("name" in x.attrs) complexTypes[x.attrs.name] = x
      }
      else return x
    })
    
    let parsed_types = simple_types.concat(Object.keys(complexTypes))
    if (init_extensions > 0 && !ct_queue.extension.length) check_stQueue()

    while (ct_queue.extension.length > 0 || ct_queue.restriction.length > 0) {
      let e = ct_queue.extension.filter(x => parsed_types.includes(getBase(x)))
      ct_queue.extension = ct_queue.extension.filter(x => !parsed_types.includes(getBase(x)))

      let r = ct_queue.restriction.filter(x => (x.content[0].element == "complexContent" && parsed_types.includes(getBase(x))) || parsedST(x.content[0]))
      ct_queue.restriction = ct_queue.restriction.filter(x => !(x.content[0].element == "complexContent" && parsed_types.includes(getBase(x))) || parsedST(x.content[0]))

      // dar uma mensagem de erro se estiver a ser referenciado algum tipo inválido
      if (!e.length && !r.length) {
        e = ct_queue.extension.filter(x => !parsed_types.includes(getBase(x))).map(x => getBase(x))
        r = ct_queue.restriction.filter(x => !parsed_types.includes(getBase(x))).map(x => getBase(x))

        let ws = "‏‏‎ ‎"
        let error_msg = (el, bases) => `${ws}${ws}- algum dos tipos {<b>${bases.join("</b>, <b>")}</b>} referenciados no atributo <b>base</b> dos elementos <b>&#60;${el}&#62;</b> (complexType)`

        let err = "Existe uma referência a um complexType inválido que é:<br>"
        if (e.length > 0) err += error_msg("extension", e)
        if (r.length > 0) err += (err[err.length-1] == "<br>" ? "" : ";<br>") + error_msg("restriction", r)

        return error(err + ".")
      }

      e.map(x => {
        let parsed = checkError(ctAPI.extend(x, complexTypes, attrGroups))
        attrGroups = parsed.attrGroups
        parsed = parsed.new_ct

        if ("name" in x.attrs) {
          complexTypes[x.attrs.name] = JSON.parse(JSON.stringify(parsed))
          parsed_types.push(x.attrs.name)
        }
        x = parsed
      })

      r.map(x => {
        let parsed = checkError(ctAPI.restrict(x, complexTypes))

        if ("name" in x.attrs) {
          complexTypes[x.attrs.name] = JSON.parse(JSON.stringify(parsed))
          parsed_types.push(x.attrs.name)
        }
      })

      if (st_queue.restrictions.length > 0 || st_queue.simpleTypes.length > 0) {
        // resolver mais simpleContent restrictions cuja base já tenha sido processada nesta ct_queue
        check_stQueue()
        
        // adicionar os novos complexTypes criados na st_queue à lista de parsed_types
        let complex_types = Object.keys(complexTypes)
        for (let i = complex_types.length-1; i >= 0; i--) {
          if (!parsed_types.includes(complex_types[i])) parsed_types.push(complex_types[i])
          else break
        }
      }
    }

    return true
  }

  // funções invocadas pela queue
  const queueFuncs = {
    // validar se o atributo "ref" está a referenciar um <element/attribute> global válido da schema ou de uma schema importada (só se valida o prefixo, neste caso)
    ref: (ref, el_name) => (ref.includes(":") || names[el_name].includes(ref)) ? true : error(`Está a tentar referenciar um elemento <b>&#60;${el_name}&#62;</b> inexistente! Só é possível referenciar elementos globais.`),
    // verificar que o tipo local que está a ser referenciado existe
    type: (type, prefix, curr_any_type, curr_type, curr_el) => {
      if (/ID(REF(S)?)?/.test(type)) id_types[type]++
      let error_msg = {
        BSC: "tipo embutido, simpleType ou complexType",
        BS: "tipo embutido ou simpleType",
        C: "complexType"
      }

      if (curr_any_type == "BS" && type in complexTypes) return error(`Neste local, só pode referenciar um ${error_msg[curr_any_type]}, mas está a tentar referenciar o complexType <b>${type}</b>!`)

      if (curr_any_type != "C" && stAPI.built_in_types(simpleTypes).includes(type)) {
        if (prefix === default_prefix || (prefix === null && existsLocalType(curr_any_type, type))) return true
        return error(`Para especificar um dos tipos embutidos de schemas XML, tem de o prefixar com o prefixo do namespace desta schema.${(noSchemaPrefix() && prefix !== null) ? " Neste caso, como não declarou um prefixo para o namespace da schema, não deve prefixar o tipo também." : ""}`)
      }
          
      if (prefix == null || prefix == default_prefix) {
        if (!existsLocalType(curr_any_type, type)) return error(`O tipo <b>${prefix===null ? "" : prefix+":"}${type}</b> não existe! Tem de referenciar um ${error_msg[curr_any_type]} válido!`)
        if (!curr_el && type === curr_type) return error(`Definições circulares detetadas para o tipo <b>${type}</b>! Isto significa que o <b>${type}</b> está contido na sua própria hierarquia, o que é um erro.`)
      }
      return true
    }
  }

  // verificar se um elemento se referencia a si mesmo recursivamente
  function recursiveElement(name, element, content) {
    for (let i = 0; i < content.length; i++) {
      if (content[i].element == element && "ref" in content[i].attrs && content[i].attrs.ref == name) return true
      if (content[i].element != "simpleType" && Array.isArray(content[i].content)) {
        if (recursiveElement(name, element, content[i].content)) return true
      }
    }
    return false
  }
      
  // copiar os atributos de um elemento referenciado para o elemento que o referencia
  function complete_refs(content, global_elems, parent) {
    for (let i = 0; i < content.length; i++) {
      // verificar se é um <element> com "ref"
      if ("ref" in content[i].attrs) {
        // identificar o elemento global que referencia
        let elem = global_elems.filter(x => x.attrs.name == content[i].attrs.ref)[0]
            
        // não entrar em loop infinito se for uma ref recursiva
        if (!recursiveElement(elem.attrs.name, elem.element, elem.content)) {
          // copiar os seus atributos e o conteúdo
          content[i].attrs = {...elem.attrs, ...content[i].attrs}
          content[i].content = elem.content
          // apagar o atributo "ref", que já não é relevante
          delete content[i].attrs.ref
        }
      }
      // se for um elemento básico (sem "ref" nem filhos) e não tiver "type", assume-se que é string
      else if (["element","attribute"].includes(content[i].element) && !("type" in content[i].attrs) && !content[i].content.length) content[i].attrs.type = default_prefix + ":string"

      // repetir recursivamente para os elementos filho
      if (content[i].element != "simpleType" && Array.isArray(content[i].content)) content[i].content = complete_refs(content[i].content, global_elems, content[i].element)
    }
    
    return content
  }
  
  // validar as tags de abertura e fecho de um elemento - prefixos e nomes de elementos coesos
  function check_elTags(el_name, prefix, close) {
    // merged é um boleano que indica se a abertura e fecho são feitos no mesmo elemento ou não
    if (!close.merged) {
      if (el_name !== close.name) return error(`Os elementos de abertura <b>&#60;${el_name}&#62;</b> e de fecho <b>&#60;${close.name}&#62;</b> devem dizer respeito ao mesmo elemento!`)
      if (prefix !== close.prefix) return error(`O prefixo do elemento de fecho do <b>&#60;${el_name}&#62;</b> tem de ser igual ao prefixo do elemento de abertura!`)
    }
    
    if (prefix !== null && prefix !== default_prefix) return error("Prefixo inválido!")
    if (prefix === null && !noSchemaPrefix()) return error("Precisa de prefixar o elemento com o prefixo do respetivo namespace!")

    return true
  }

  // verificar que um elemento não tem <element/attribute> locais com o mesmo nome
  function check_repeatedNames(parent, el_name, content) {
    // filtrar apenas os elementos <element/attribute> do conteúdo e ir buscar os respetivos nomes
    let els = content.filter(x => el_name.test(x.element))
    
    let els_obj = {}
    for (let i = 0; i < els.length; i++) {
      let name = els[i].attrs["name" in els[i].attrs ? "name" : "ref"]

      if (!(els[i].element in els_obj)) els_obj[els[i].element] = []
      els_obj[els[i].element].push(name)
    }
    
    for (let el in els_obj) {
      // verificar se há nomes repetidos para cada tipo de elemento
      let duplicates = els_obj[el].filter((item, index) => els_obj[el].indexOf(item) !== index)
      if (duplicates.length > 0) return error(`Os elementos <b>&#60;${el}&#62;</b> locais de um elemento devem ter todos nomes distintos entre si! Neste caso, o elemento <b>&#60;${parent}&#62;</b> tem mais do que um <b>&#60;${el}&#62;</b> com o nome <i>${duplicates[0]}</i>.`)
    }
    return true
  }

  // verificar que o filho de um <group> não tem os atributos 'max/minOccurs'
  function check_groupContent(attrs, content) {
    if (!atRoot() && content.length > 0) return error("Os elementos <b>&#60;group&#62;</b> devem ser definidos globalmente e referenciados dentro de outros elementos!")

    if (content.some(x => "maxOccurs" in x.attrs || "minOccurs" in x.attrs))
      return error(`Um elemento-filho de um <b>&#60;group&#62;</b> não podem possuir os atributos <b>maxOccurs</b> ou <b>minOccurs</b>! Só o elemento <b>&#60;group&#62;</b> em si.`)

    if ("ref" in attrs) { if (content.length > 0) return error("Um elemento <b>&#60;group&#62;</b> com o atributo <b>ref</b> não pode ter nenhum elemento filho!") }
    else if (!content.length) return error("Um elemento <b>&#60;group&#62;</b> sem o atributo <b>ref</b> não pode ter conteúdo vazio!")
      
    if (content.length > 0) {
      content[0].attrs.maxOccurs = 1
      content[0].attrs.minOccurs = 1
    }

    return content
  }


  // Funções auxiliares relacionadas com atributos ------------------------------

  // juntar todos os atributos do elemento num só objeto
  const getAttrs = objArr => objArr === null ? {} : cleanContent(objArr).reduce(((r,c) => { r[c.attr] = c.val; return r }), {})
  // verificar se o array de atributos tem algum atributo repetido
  const check_repeatedAttrs = (arr, attrs, el_name) => (Object.keys(attrs).length == arr.length) ? attrs : error(`O elemento <b>&#60;${el_name}&#62;</b> não pode possuir atributos repetidos!`)
  // verificar se o atributo em questão está presente
  const check_requiredAttr = (attrs, el_name, attr_name) => attr_name in attrs ? attrs : error(`Um elemento <b>&#60;${el_name}&#62;</b> requer o atributo <b>${attr_name}</b>!`)
  // validar um elemento <element/attribute> básico - verificar que tem os atributos essenciais
  const validateLocalEl = attrs => "ref" in attrs || "name" in attrs
  // verificar se o novo id é único na schema
  const validateID = id => !ids.includes(id) ? true : error(`O valor do atributo <b>id</b> deve ser único na schema! Existe mais do que um elemento na schema com o id <b>${id}</b>!`)

  // guardar o valor do atributo 'minOccurs' na estrutura de dados, se 'maxOccurs' for "unbounded"
  function getUnboundedMin(attrs) {
    if ("maxOccurs" in attrs && "minOccurs" in attrs && attrs.maxOccurs == "unbounded") unbounded_min.push(attrs.minOccurs)
  }

  // validar os atributos de um elemento <any/all/choice/sequence>
  function check_occursAttrs(arr, el_name) {
    let attrs = check_repeatedAttrs(arr, getAttrs(arr), el_name)
    getUnboundedMin(attrs)
    return attrsAPI.defaultOccurs(attrs, curr)
  }

  // validar o nome de um <element/attribute/notation> - deve ser único
  function validateName(name, el_name) {
    // verificar que são elementos globais
    if (atRoot()) {
      if (!names[el_name].includes(name)) {names[el_name].push(name); return true}
      return error(`Todos os elementos <b>&#60;${el_name}&#62;</b> ${el_name != "notation" ? "definidos globalmente " : ""}devem ter nomes únicos!`)
    }
    if (["key","keyref","unique"].includes(el_name)) {
      if (!names.elem_constraint.includes(name)) {names.elem_constraint.push(name); return true}
      return error(`Todos os elementos <b>&#60;key&#62;</b>, <b>&#60;keyref&#62;</b> e <b>&#60;unique&#62;</b> devem ter nomes únicos!`)
    }
    return true
  }

  // validar o valor de atributos que sejam listas
  function validate_listOfValues(l, error_msg) {
    let arr = l.split(/[ \t\n\r]+/)
    return (new Set(arr)).size === arr.length ? true : error(error_msg)
  }

  // validar o valor do atributo "namespace" de um elemento <any/anyAttribute>, se não for ##any nem ##other
  function check_namespace(l) {
    let arr = l.split(/[ \t\n\r]+/)
    let error_msg = "O valor do atributo <b>namespace</b> deve corresponder a ((##any | ##other) | Lista de (referência_URI | (##targetNamespace | ##local)))!"

    // verificar que não tem mais do que 1 URI
    if (arr.filter(x => x != "##local" && x != "##targetNamespace").length > 1) return error(error_msg)
    // verificar que não tem nenhum valor repetido
    return (new Set(arr)).size === arr.length ? true : error(error_msg)
  }

  // validar as tags e verificar se o atributo "base" está presente
  function check_requiredBase(el_name, parent_el, prefix, attrs, close) {
    if (!("base" in attrs)) return error(`O atributo <b>base</b> é requirido num elemento <b>&#60;${el_name}&#62;</b> (${parent_el})!`)
    return check_elTags(el_name, prefix, close) && check_repeatedNames(el_name, /attribute(Group)?/, close.content)
  }
  
  // verificar que um elemento <element> não tem o atributo "ref" e um dos elementos filhos mutualmente exclusivos com esse
  function check_elemMutex(attrs, content) {
    if ("type" in attrs && content.some(x => ["simpleType","complexType"].includes(x.element)))
      return error("O atributo <b>type</b> e os elementos-filho <b>&#60;simpleType&#62;</b>/<b>&#60;complexType&#62;</b> são formas mutuamente exclusivas de especificar o tipo de um elemento <b>&#60;element&#62;</b>!")
    if ("ref" in attrs && content.some(x => ["simpleType","complexType","key","keyref","unique"].includes(x.element)))
      return error("Se o atributo <b>ref</b> está presente num elemento <b>&#60;element&#62;</b>, o seu conteúdo não pode conter nenhum elemento <b>&#60;simpleType&#62;</b>, <b>&#60;complexType&#62;</b>, <b>&#60;key&#62;</b>, <b>&#60;keyref&#62;</b> ou <b>&#60;unique&#62;</b>!")
    return true
  }

  // verificar que um elemento <attribute> não tem um elemento filho <simpleType> e um dos atributos mutualmente exclusivos com esse
  function check_attrMutex(attrs, content) {
    let error_msg = attr => `O atributo <b>${attr}</b> só pode estar presente no elemento <b>&#60;attribute&#62;</b> quando o seu conteúdo não contém um elemento <b>&#60;simpleType&#62;</b>!`

    if (content.some(x => x.element === "simpleType")) {
      if ("type" in attrs) return error(error_msg("type"))
      if ("ref" in attrs) return error(error_msg("ref"))
    }

    return true
  }

  // verificar que um elemento <attributeGroup> não tem conteúdo se tiver o atributo "ref"
  function check_attrGroupMutex(attrs, content) {
    if (!atRoot() && content.length > 0) return error("Os elementos <b>&#60;attributeGroup&#62;</b> devem ser definidos globalmente e referenciados dentro de outros elementos!")

    if ("ref" in attrs && content.some(x => x.element != "annotation"))
      return error("Se um elemento <b>&#60;attributeGroup&#62;</b> tiver o atributo <b>ref</b> especificado, o seu conteúdo só pode ser, no máximo, um elemento <b>&#60;annotation&#62;</b>!")

    if (atRoot() && content.some(x => x.element == "attributeGroup" && "ref" in x.attrs && x.attrs.ref == attrs.name))
      return error(`Definições circulares detetadas para o grupo de atributos <b>${attrs.name}</b>! Um <b>&#60;attributeGroup&#62;</b> não se pode incluir recursivamente na sua própria hierarquia!`)

    return true
  }

  // verificar que um elemento <complexType> não tem o atributo "mixed" e um elemento filho simpleContent
  function check_complexTypeMutex(attrs, content) {
    if (attrs.mixed && content.some(x => x.element == "simpleContent"))
      return error("Se um elemento <b>&#60;complexType&#62;</b> tiver um elemento filho <b>&#60;simpleContent&#62;</b>, não é permitido o atributo <b>mixed</b>!")

    if (content.filter(x => ["simpleContent","complexContent","group","sequence","choice","all"].includes(x.element)).length > 1)
      return error('Um elemento <b>&#60;complexType&#62;</b> só pode conter apenas um dos seguintes elementos: <b>&#60;simpleContent&#62;</b>, <b>&#60;complexContent&#62;</b>, <b>&#60;group&#62;</b>, <b>&#60;sequence&#62;</b>, <b>&#60;choice&#62;</b> ou <b>&#60;all&#62;</b>!')
    
    if ("name" in attrs && content.some(x => x.element == "simpleContent")) local_types.simpleContent.push(attrs.name)
    return true
  }


  // Funções auxiliares relacionadas com tipos ------------------------------
  
  // verificar se já existe algum tipo local com este nome
  const existsLocalType = (curr_any_type, type) => (curr_any_type == "BSC" && Object.values(local_types).flat().includes(type)) || 
                                                   (curr_any_type == "BS" && local_types.simpleType.includes(type)) || 
                                                   (curr_any_type == "C" && local_types.complexType.includes(type))
  // validar um elemento <union> - verificar que referencia algum tipo
  const validateUnion = (attrs,content) => ("memberTypes" in attrs ? attrs.memberTypes.length : 0) + content.filter(e => e.element === "simpleType").length > 0 ? true : 
                                           error(`Um elemento <b>&#60;union&#62;</b> deve ter o atributo <b>memberTypes</b> não vazio e/ou pelo menos um elemento filho <b>&#60;simpleType&#62;</b>!`)

  // verificar se o nome do novo tipo já existe e adicioná-lo à lista de nomes respetiva caso seja único
  function newLocalType(name, kind) {
    let local_names = Object.values(local_types).flat()
    if (local_names.includes(name)) return error(`Já existe um simpleType/complexType com o nome <b>${name}</b> nesta schema!`)
    local_types[kind].push(name)

    if (stAPI.built_in_types(simpleTypes).includes(name) || Object.values(modTypeNames).includes(name)) {
      let i = 2
      while (local_names.includes(name+i)) {i++}

      modTypeNames[name] = name + i
      name = name + i
    }

    current_type = name
    return name
  }

  // validar o tipo de um elemento de derivação - tem de ter ou o atributo de referência ou um elemento filho <simpleType>
  function check_derivingType(elem, attr, attrs, content) {
    if (attr in attrs && content.some(x => x.element === "simpleType"))
      return error(`A utilização do elemento filho <b>&#60;simpleType&#62;</b> e do atributo <b>${attr}</b> é mutualmente exclusiva no elemento <b>&#60;${elem}&#62;</b>!`)
    if (!(attr in attrs) && !content.filter(x => x.element == "simpleType").length)
      return error(`Um elemento <b>&#60;${elem}&#62;</b> deve ter o atributo <b>${attr}</b> ou um elemento filho <b>&#60;simpleType&#62;</b> para indicar o tipo a derivar!`)
    return true
  }

  // incluir as informações da função do DataGen que vai dar override ao simpleType do elemento em questão, se for o caso
  function datagenTypeOverride(el_name, attrs, close) {
    let result = {element: el_name, attrs, content: close.content}
    if (!close.merged && close.content.length > 0 && close.content[0].element == "datagen") {
      let datagen = close.content.shift()
      delete datagen.element
      result.datagen = datagen
    }
    return result
  }
}

DSL_text = ws dec:XML_declaration xsd:schema comments { return {xml_declaration: dec, xsd, simpleTypes, complexTypes, unbounded_min} }

ws "whitespace" = [ \t\n\r]*
ws2 = [ \t\n\r]+


// ----- Declaração XML -----

XML_declaration = comments dec:$("<?xml" XML_version XML_encoding? XML_standalone? ws '?>') ws {return dec}

XML_version = ws2 "version" ws "=" ws q1:QM "1.0" q2:QM &{return checkQM(q1,q2,null,null)}

XML_encoding = ws2 "encoding" ws "=" ws q1:QM XML_encoding_value q2:QM &{return checkQM(q1,q2,null,null)}
XML_encoding_value = "UTF-"("8"/"16") / "ISO-10646-UCS-"("2"/"4") / "ISO-8859-"[1-9] / "ISO-2022-JP" / "Shift_JIS" / "EUC-JP"

XML_standalone = ws2 "standalone" ws "=" ws q1:QM XML_standalone_value q2:QM &{return checkQM(q1,q2,null,null)}
XML_standalone_value = "yes" / "no"

// ----- <schema> -----

schema = comments (p:open_XSD_el {default_prefix = p}) el_name:"schema" attrs:schema_attrs ws ">" ws content:schema_content close_schema
         &{return check_stQueue() && check_ctQueue() && checkError(attrsAPI.check_repeatedAttributes(attrGroups)) && checkQueue()} {
  content = complete_refs(content, content, "schema")

  let complexKeys = Object.keys(complexTypes)
  for (let i = 0; i < complexKeys.length; i++) {
    complexTypes[complexKeys[i]].content = complete_refs(complexTypes[complexKeys[i]].content, complexTypes[complexKeys[i]].content, "schema")
  }

  if ((id_types.IDREF + id_types.IDREFS) > 0 && !id_types.ID) return error("A schema possui 1 ou mais elementos com tipo <b>IDREF(S)</b>, mas nenhum com tipo <b>ID</b>, pelo que não é possível fazer esta referenciação!")
  return {element: el_name, prefix: default_prefix, attrs, content}
}

close_schema = prefix:close_XSD_prefix "schema" ws ">" ws &{
  if (!noSchemaPrefix() && prefix === null) return error("Precisa de prefixar o elemento de fecho da schema!")
  if (noSchemaPrefix() && prefix !== null) return error("Não pode usar um prefixo aqui porque não predefiniu um prefixo para o namespace da schema!")
  if (prefix !== default_prefix) return error("Precisa de prefixar o elemento de fecho da schema com o prefixo predefinido do seu namespace!")
  return true
}

schema_attrs = attrs:(formDefault / blockDefault / finalDefault / xmlns / elem_id / elem_lang / schema_version / targetNamespace)+
              &{return checkError(attrsAPI.check_schemaAttrs(attrs, default_prefix))} {
  let targetIndex = attrs.findIndex(x => x.attr == "targetNamespace")
  if (targetIndex > -1) target_prefixes = attrs.filter(x => x.attr == "namespace" && x.val == attrs[targetIndex].val).map(x => x.prefix)
  return attrs
}

formDefault = ws2 attr:$(("attribute"/"element")"FormDefault") ws "=" q1:QMo val:form_values q2:QMc {return checkQM(q1,q2,attr,val)}
blockDefault = ws2 attr:"blockDefault" ws "=" q1:QMo val:block_values q2:QMc                        {return checkQM(q1,q2,attr,val)}
finalDefault = ws2 attr:"finalDefault" ws "=" q1:QMo val:finalDefault_values q2:QMc                 {return checkQM(q1,q2,attr,val)}
xmlns = ws2 "xmlns" prefix:(":" p:NCName {return p})? ws "=" ws val:string                          {prefixes.push(prefix); return {attr: "namespace", prefix, val}}
schema_version = ws2 attr:"version" ws "=" ws val:string                                            {return {attr, val: val.trim().replace(/[\t\n\r]/g," ").replace(/ +/g," ")}} // o valor da versão é um xs:token, que remove todos os \t\n\r da string, colapsa os espaços e dá trim à string
targetNamespace = ws2 attr:"targetNamespace" ws "=" ws val:string                                   {return {attr, val}}

schema_content = el:((redefine / include / import / annotation)* (((simpleType / complexType / group / attributeGroup) / element / attribute / notation) annotation*)*) {return cleanContent(el.flat(3))}


// ----- <include> -----

include = comments prefix:open_XSD_el el_name:"include" attrs:schemaLocID_attrs ws close:(merged_close / ann_content)
          &{return check_elTags(el_name, prefix, close)}
          {return null} //{return {element: el_name, attrs, content: close.content}}

schemaLocID_attrs = el:(schemaLocation elem_id? / elem_id schemaLocation?)? {return check_requiredAttr(getAttrs(el), "include", "schemaLocation")}

schemaLocation = ws2 attr:"schemaLocation" ws "=" ws val:string {return {attr, val}}


// ----- <import> -----

import = comments prefix:open_XSD_el el_name:"import" attrs:import_attrs ws close:(merged_close / ann_content)
         &{return check_elTags(el_name, prefix, close)}
         {return null} //{return {element: el_name, attrs, content: close.content}}

import_attrs = el:(import_namespace / elem_id / schemaLocation)* {return check_repeatedAttrs(el, getAttrs(el), "import")}

import_namespace = ws2 attr:"namespace" ws "=" ws val:string {return {attr, val}}


// ----- <redefine> -----

redefine = comments prefix:open_XSD_el el_name:$("redefine" {curr.redefine = true}) attrs:schemaLocID_attrs ws 
           close:(merged_close / openEl content:redefine_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
           &{return check_elTags(el_name, prefix, close)}
           {curr.redefine = false; return null} //return {element: el_name, attrs, content: close.content}}

redefine_content = c:(comments annotation / (simpleType / complexType / group / attributeGroup))* {return cleanContent(c)}


// ----- <element> -----

element = comments prefix:open_XSD_el el_name:$("element" {any_type = "BSC"; curr.element = true}) attrs:element_attrs ws
          close:(merged_close / openEl content:element_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) &{
  if ((close.merged || !close.content.length) && !validateLocalEl(attrs)) return error("Um elemento local deve ter, pelo menos, o atributo <b>name</b> ou <b>ref</b>!")
  return check_elTags(el_name, prefix, close) && check_elemMutex(attrs, close.content)
} { return datagenTypeOverride(el_name, attrs, close) }

element_attrs = el:(elem_abstract / elem_block / elem_default / elem_substitutionGroup /
                elem_final / elem_fixed / elem_form / elem_id / elem_minOccurs /
                elem_maxOccurs / elem_name / elem_nillable / elem_ref / elem_type)* {
  let attrs = checkError(attrsAPI.check_elemAttrs(el, schema_depth, curr))
  getUnboundedMin(attrs)
  curr.element = false
  return attrs
}

elem_abstract = ws2 attr:"abstract" ws "=" q1:QMo val:boolean q2:QMc                                        {return checkQM(q1,q2,attr,val)}
elem_block = ws2 attr:"block" ws "=" q1:QMo val:block_values q2:QMc                                         {return checkQM(q1,q2,attr,val)}
elem_default = ws2 attr:"default" ws "=" ws val:string                                                      {return {attr,val}}
elem_final = ws2 attr:"final" ws "=" q1:QMo val:elem_final_values q2:QMc                                    {return checkQM(q1,q2,attr,val)}
elem_fixed = ws2 attr:"fixed" ws "=" ws val:string                                                          {return {attr,val}}
elem_form = ws2 attr:"form" ws "=" q1:QMo val:form_values q2:QMc                                            {return checkQM(q1,q2,attr,val)}
elem_id = ws2 attr:"id" ws "=" q1:QMo val:ID q2:QMc                                                         {return checkQM(q1,q2,attr,val)}
elem_maxOccurs = ws2 attr:"maxOccurs" ws "=" q1:QMo val:(int/"unbounded") q2:QMc                            {return checkQM(q1,q2,attr,val)}
elem_minOccurs = ws2 attr:"minOccurs" ws "=" q1:QMo val:int q2:QMc                                          {return checkQM(q1,q2,attr,val)}
elem_name = ws2 attr:"name" ws "=" q1:QMo val:NCName q2:QMc           &{return validateName(val,"element")} {return checkQM(q1,q2,attr,val)}
elem_nillable = ws2 attr:"nillable" ws "=" q1:QMo val:boolean q2:QMc                                        {return checkQM(q1,q2,attr,val)}
elem_lang = ws2 attr:"xml:lang" ws "=" q1:QMo val:language q2:QMc                                           {return checkQM(q1,q2,attr,val)}
elem_ref = ws2 attr:"ref" ws "=" q1:QMo val:QName q2:QMc {queue.push({attr: "ref", args: [val, "element"]}); return checkQM(q1,q2,attr,val)}
elem_source = ws2 attr:"source" ws "=" ws val:string                                                        {return {attr,val}}
elem_substitutionGroup = ws2 attr:"substitutionGroup" ws "=" q1:QMo val:QName q2:QMc                        {return checkQM(q1,q2,attr,val)}
elem_type = ws2 attr:"type" ws "=" q1:QMo val:type_value q2:QMc                                             {return checkQM(q1,q2,attr,val)}

element_content = c:(datagen_comment? comments annotation? (simpleType / complexType)? (keyOrUnique / keyref)*) {return cleanContent(c.flat())}


// ----- <field> -----

field = comments prefix:open_XSD_el el_name:"field" attrs:field_attrs ws close:(merged_close / ann_content)
        &{return check_elTags(el_name, prefix, close)}
        {return null} //{return {element: el_name, attrs, content: close.content}}

field_attrs = attrs:(field_xpath elem_id? / elem_id field_xpath?)? {return check_requiredAttr(getAttrs(attrs), "field", "xpath")}

field_xpath = ws2 attr:"xpath" ws "=" q1:QMo val:fieldXPath q2:QMc {return checkQM(q1,q2,attr,val)}


// ----- <selector> -----

selector = comments prefix:open_XSD_el el_name:"selector" attrs:selector_attrs ws close:(merged_close / ann_content)
           &{return check_elTags(el_name, prefix, close)}
           {return null} //{return {element: el_name, attrs, content: close.content}}

selector_attrs = attrs:(selector_xpath elem_id? / elem_id selector_xpath?)? {return check_requiredAttr(getAttrs(attrs), "selector", "xpath")}

selector_xpath = ws2 attr:"xpath" ws "=" q1:QMo val:selectorXPath q2:QMc {return checkQM(q1,q2,attr,val)}


// ----- <key/unique> -----

keyOrUnique = comments prefix:open_XSD_el el_name:$("key"/"unique") 
              attrs:(a:keyOrUnique_attrs &{return check_requiredAttr(a, el_name, "name") && validateName(a.name, el_name)} {return a}) ws
              close:(merged_close / openEl content:xpath_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
              &{return check_elTags(el_name, prefix, close)}
              {return null} //{return {element: el_name, attrs, content: close.content}}

keyOrUnique_attrs = attrs:(elem_constraint_name elem_id? / elem_id elem_constraint_name?)? {return getAttrs(attrs)}

elem_constraint_name = ws2 attr:"name" ws "=" q1:QMo val:NCName q2:QMc {return checkQM(q1,q2,attr,val)}

xpath_content = c:(comments annotation? (selector field+)) {return cleanContent(c.flat())}


// ----- <keyref> -----

keyref = comments prefix:open_XSD_el el_name:"keyref" attrs:(a:keyref_attrs &{return validateName(a.name, el_name)} {return a}) ws
         close:(merged_close / openEl content:xpath_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
         &{return check_elTags(el_name, prefix, close)}
         {return null} //{return {element: el_name, attrs, content: close.content}}

keyref_attrs = attrs:(elem_id / elem_constraint_name / keyref_refer)* {return checkError(attrsAPI.check_keyrefAttrs(attrs))}

keyref_refer = ws2 attr:"refer" ws "=" q1:QMo val:QName q2:QMc {return checkQM(q1,q2,attr,val)}


// ----- <attribute> -----

attribute = comments prefix:open_XSD_el el_name:$("attribute" {any_type = "BS"}) attrs:attribute_attrs ws
            close:(merged_close / openEl content:attribute_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) &{
  if ((close.merged || !close.content.length) && !validateLocalEl(attrs)) return error("Um atributo local deve ter, pelo menos, o atributo <b>name</b> ou <b>ref</b>!")
  return check_elTags(el_name, prefix, close) && check_attrMutex(attrs, close.content)
} { return datagenTypeOverride(el_name, attrs, close) }

attribute_attrs = el:(elem_default / elem_fixed / elem_form / elem_id / attr_name / attr_ref / elem_type / attr_use)*
                  {any_type = "BSC"; return checkError(attrsAPI.check_attributeElAttrs(el, "attribute", schema_depth))}

attr_name = ws2 attr:"name" ws "=" q1:QMo val:NCName q2:QMc                &{return validateName(val,"attribute")} {return checkQM(q1,q2,attr,val)}
attr_ref = ws2 attr:"ref" ws "=" q1:QMo val:QName q2:QMc      {queue.push({attr: "ref", args: [val, "attribute"]}); return checkQM(q1,q2,attr,val)}
attr_use = ws2 attr:"use" ws "=" q1:QMo val:use_values q2:QMc                                                      {return checkQM(q1,q2,attr,val)}

attribute_content = c:(datagen_comment? comments annotation? simpleType?) {return cleanContent(c)}


// ----- <attributeGroup> -----

attributeGroup = comments prefix:open_XSD_el el_name:"attributeGroup" attrs:attributeGroup_attrs ws
                 close:(merged_close / openEl content:attributeGroup_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
                 &{return check_elTags(el_name, prefix, close) && check_attrGroupMutex(attrs, close.content) && check_repeatedNames(el_name, /attribute(Group)?/, close.content)} {
  if ("name" in attrs) attrGroups = attrsAPI.addAttrGroup(attrGroups, attrs.name, el_name, close.content)
  return {element: el_name, attrs, content: close.content}
}

attributeGroup_attrs = el:(elem_id / attrGroup_name / attrGroup_ref)* {return checkError(attrsAPI.check_attributeElAttrs(el, "attributeGroup", schema_depth))}

attrGroup_name = ws2 attr:"name" ws "=" q1:QMo val:NCName q2:QMc           &{return validateName(val,"attributeGroup")} {return checkQM(q1,q2,attr,val)}
attrGroup_ref = ws2 attr:"ref" ws "=" q1:QMo val:QName q2:QMc {queue.push({attr: "ref", args: [val, "attributeGroup"]}); return checkQM(q1,q2,attr,val)}

attributeGroup_content = c:(comments annotation? attributes) {return cleanContent(c.flat())}


// ----- <anyAttribute> -----

anyAttribute = comments prefix:open_XSD_el el_name:"anyAttribute" attrs:anyAttribute_attrs ws close:(merged_close / ann_content)
               &{return check_elTags(el_name, prefix, close)} 
               {return null} //{return {element: el_name, attrs, content: close.content}}

anyAttribute_attrs = el:(elem_id / any_namespace / processContents)* {return check_repeatedAttrs(el, getAttrs(el), "anyAttribute")}

any_namespace = ws2 attr:"namespace" ws "=" ws val:namespace_values                          {return {attr, val}}
processContents = ws2 attr:"processContents" ws "=" q1:QMo val:processContents_values q2:QMc {return checkQM(q1,q2,attr,val)}


// ----- <any> -----

any = comments prefix:open_XSD_el el_name:"any" attrs:any_attrs ws close:(merged_close / ann_content)
      &{return check_elTags(el_name, prefix, close)} 
      {return null} //{return {element: el_name, attrs, content: close.content}}

any_attrs = el:(elem_id / elem_maxOccurs / elem_minOccurs / any_namespace / processContents)* {return check_occursAttrs(el,"any")}


// ----- <simpleType> -----

simpleType = comments prefix:open_XSD_el el_name:$("simpleType" {any_type = "BS"}) attrs:simpleType_attrs ws (openEl {type_depth++}) ws content:simpleType_content close_el:close_XSD_el
             &{return check_elTags(el_name, prefix, {merged: false, ...close_el})} {
  if (!--type_depth) current_type = null

  let simpleType = {element: el_name, attrs}, arg_name = attrs.name
  // o nome de um simpleType nunca pode começar por algarismos, logo nunca coincide com um simpleType existente
  if (!("name" in attrs)) simpleType.attrs.name = "" + ++noNameST

  st_queue.simpleTypes.push({
    info: {name: simpleType.attrs.name, base: stAPI.get_base(content, default_prefix, simpleTypes)},
    args: [arg_name, content],
    ref: simpleType
  })

  return simpleType
}

simpleType_attrs = el:(simpleType_final / elem_id / simpleType_name)* {return checkError(attrsAPI.check_localTypeAttrs(el, "simpleType", schema_depth, curr))}

simpleType_final = ws2 attr:"final" ws "=" q1:QMo val:simpleType_final_values q2:QMc                       {return checkQM(q1,q2,attr,val)}
simpleType_name = ws2 attr:"name" ws "=" q1:QMo val:NCName q2:QMc    {val = newLocalType(val,"simpleType"); return checkQM(q1,q2,attr,val)}

simpleType_content = c:(comments annotation? (restrictionST / list / union)) {any_type = "BSC"; return cleanContent(c)}


// ----- <annotation> -----

annotation = comments prefix:open_XSD_el el_name:"annotation" attr:elem_id? ws
             close:(merged_close / openEl content:annotation_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
             &{return check_elTags(el_name, prefix, close)}
             {return null} //{return {element: el_name, attrs: getAttrs(attr), content: close.content}}

annotation_content = (appinfo / documentation)*


// ----- <appinfo> -----

appinfo = comments (appinfo_simple / appinfo_prefix) comments

appinfo_simple = "<" el_name:"appinfo" attr:elem_source? ws
                 close:("/>" ws {return ""} / openEl content:appinfo_content_simple? close_appinfo_simple {schema_depth--; return content===null ? "" : content})
                 {return {element: el_name, attrs: getAttrs(attr), content: close}}

appinfo_prefix = prefix:open_XSD_el el_name:"appinfo" attr:elem_source? ws
                 close:(merged_close / openEl content:appinfo_content_prefix? close_el:close_appinfo_prefix {schema_depth--; return {merged: false, ...close_el, content}})
                 &{return check_elTags(el_name, prefix, close)} 
                 {return {element: el_name, attrs: getAttrs(attr), content: (close.content === [] || close.content === null) ? "" : close.content}}

appinfo_content_simple = comments (!close_appinfo_simple). appinfo_content_simple* {return text().trim()}
appinfo_content_prefix = comments (!close_appinfo_prefix). appinfo_content_prefix* {return text().trim()}

close_appinfo_simple = "</appinfo" ws ">" ws
close_appinfo_prefix = prefix:close_XSD_prefix name:"appinfo" ws ">" ws {return {name, prefix}}


// ----- <documentation> -----

documentation = comments (doc_simple / doc_prefix) comments

documentation_attrs = attrs:(elem_source elem_lang? / elem_lang elem_source?)? {return getAttrs(attrs)}

doc_simple = "<" el_name:"documentation" attrs:documentation_attrs ws
             close:("/>" ws {return ""} / openEl content:doc_content_simple? close_doc_simple {schema_depth--; return content===null ? "" : content})
             {return {element: el_name, attrs, content: close}}

doc_prefix = prefix:open_XSD_el el_name:"documentation" attrs:documentation_attrs ws 
             close:(merged_close / openEl content:doc_content_prefix? close_el:close_doc_prefix {schema_depth--; return {merged: false, ...close_el, content}})
             &{return check_elTags(el_name, prefix, close)}
             {return {element: el_name, attrs, content: (close.content===[] || close.content===null) ? "" : close.content}}

doc_content_prefix = comments (!close_doc_prefix). doc_content_prefix* {return text().trim()}
doc_content_simple = comments (!close_doc_simple). doc_content_simple* {return text().trim()}

close_doc_simple = "</documentation" ws ">" ws
close_doc_prefix = prefix:close_XSD_prefix name:"documentation" ws ">" ws {return {name, prefix}}


// ----- <union> -----

union = comments prefix:open_XSD_el el_name:"union" attrs:union_attrs ws 
        close:(merged_close / openEl content:union_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
        &{return check_elTags(el_name, prefix, close) && validateUnion(attrs, close.content)}
        {return {element: el_name, attrs, content: close.content}}

union_attrs = attrs:(elem_id union_memberTypes? / union_memberTypes elem_id?)? {return getAttrs(attrs)}

union_memberTypes = ws2 attr:"memberTypes" ws "=" q1:QMo val:list_types q2:QMc {return checkQM(q1,q2,attr,val)}

union_content = c:(comments annotation? simpleType*) {return cleanContent(c.flat())}


// ----- <list> -----

list = comments prefix:open_XSD_el el_name:"list" attrs:list_attrs ws 
       close:(merged_close / openEl content:list_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
       &{return check_elTags(el_name, prefix, close) && check_derivingType(el_name, "itemType", attrs, close.content)} 
       {return {element: el_name, attrs, content: close.content}}

list_attrs = attrs:(elem_id list_itemType? / list_itemType elem_id?)? {return getAttrs(attrs)}

list_itemType = ws2 attr:"itemType" ws "=" q1:QMo val:type_value q2:QMc {return checkQM(q1,q2,attr,val)}

list_content = c:(comments annotation? simpleType?) {return cleanContent(c)}


// ----- <restriction> (simpleType) -----

restrictionST = comments prefix:open_XSD_el el_name:"restriction" attrs:base_attrs ws 
                close:(merged_close / openEl content:restrictionST_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
                &{return check_elTags(el_name, prefix, close) && check_derivingType(el_name, "base", attrs, close.content)} {
  let restriction = {element: el_name, attrs}, arg_base = attrs.base
  if (!("base" in attrs)) restriction.attrs.base = close.content[0].attrs.name

  st_queue.restrictions.push({
    // ou é o atributo base ou o nome do simpleType filho
    base: stAPI.getTypeInfo(restriction.attrs.base, default_prefix, simpleTypes).type,
    parent: "simpleType",
    args: [arg_base, close.content],
    ref: restriction
  })
  
  return restriction
}

base_attrs = attrs:(base elem_id? / elem_id base?)? {return getAttrs(attrs)}

base = ws2 attr:"base" ws "=" q1:QMo val:type_value q2:QMc {return checkQM(q1,q2,attr,val)}
                     
restrictionST_content = comments h1:annotation? h2:simpleType? t:constrFacet* {return cleanContent([h1, h2, ...t])}


// ----- <restriction> (simpleContent) -----

restrictionSC = comments prefix:open_XSD_el el_name:"restriction" attrs:base_attrs ws 
                close:(merged_close / openEl content:restrictionSC_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) 
                &{return check_requiredBase(el_name, "simpleContent", prefix, attrs, close)} {
  let restriction = {element: el_name, attrs}, arg_base = attrs.base
  let base

  if (arg_base in complexTypes) {
    // se for referência a um complexType que não seja por derivação, o seu conteúdo deve ser mixed e emptiable
    let base_ct = JSON.parse(JSON.stringify(complexTypes[arg_base]))
    checkError(ctAPI.validateBaseRestrictionSC(base_ct))

    if (base_ct.content.length > 0) {
      if (["all","choice","sequence"].includes(base_ct.content[0].element)) {
        base_ct.content[0].attrs.minOccurs = 0
        base_ct.content[0].attrs.maxOccurs = 0
      }
      
      base_ct = ctAPI.copyRefs(base_ct, complexTypes[arg_base])
    }
    base_ct.mixed_type = {}

    // texto que aparece entre partículas por causa de ser mixed
    st_queue.restrictions.push({
      base: "string",
      parent: "simpleContent",
      args: ["xs:string", close.content],
      complex: true,
      ref: base_ct.mixed_type
    })

    restriction.element = "mixed_restriction"
    restriction.content = base_ct
  }
  else {
    base = stAPI.getTypeInfo(arg_base, default_prefix, simpleTypes).type

    st_queue.restrictions.push({
      base,
      parent: "simpleContent",
      args: [arg_base, close.content],
      complex: true,
      ref: restriction
    })
  }

  return restriction
}
                     
restrictionSC_content = comments c:(restrictionST_content attributes) {return cleanContent(c.flat())}


// ----- <restriction> (complexContent) -----

restrictionCC = comments prefix:open_XSD_el el_name:"restriction" attrs:base_attrs ws 
                close:(merged_close / openEl content:CC_son_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) 
                &{return check_requiredBase(el_name, "complexContent", prefix, attrs, close)} 
                {return {element: el_name, attrs, content: close.content}}
                     
CC_son_content = c:(comments annotation? (all / choiceOrSequence / group)? attributes) {return cleanContent(c.flat())}


// ----- <extension> (simpleContent) -----

extensionSC = comments prefix:open_XSD_el el_name:"extension" attrs:base_attrs ws 
              close:(merged_close / openEl content:extensionSC_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) 
              &{return check_requiredBase(el_name, "simpleContent", prefix, attrs, close)}
              {return {element: el_name, attrs, content: close.content}}
                     
extensionSC_content = c:(comments annotation? attributes) {return cleanContent(c.flat())}


// ----- <extension> (complexContent) -----

extensionCC = comments prefix:open_XSD_el el_name:"extension" attrs:base_attrs ws 
              close:(merged_close / openEl content:CC_son_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) 
              &{return check_requiredBase(el_name, "complexContent", prefix, attrs, close)} 
              {return {element: el_name, attrs, content: close.content}}


// ----- <minExclusive> <minInclusive> <maxExclusive> <maxInclusive> <totalDigits <fractionDigits> <length> <minLength> <maxLength> <enumeration> <whiteSpace> <pattern> -----

constrFacet = comments prefix:open_XSD_el el_name:constrFacet_values 
              attrs:(a:constrFacet_attrs ws {return checkError(attrsAPI.check_constrFacetAttrs(el_name, a))})
              close:(merged_close / ann_content)
              &{return check_elTags(el_name, prefix, close)}
              {return {element: el_name, attrs}}

constrFacet_attrs = el:(elem_id / constrFacet_fixed / constrFacet_value)* {return el}

constrFacet_fixed = ws2 attr:"fixed" ws "=" q1:QMo val:boolean q2:QMc {return checkQM(q1,q2,attr,val)}
constrFacet_value = ws2 attr:"value" ws "=" ws val:string             {return {attr, val}}


// ----- <complexType> -----

complexType = comments prefix:open_XSD_el el_name:"complexType" attrs:complexType_attrs ws 
              close:(merged_close / (openEl {type_depth++}) content:complexType_content close_el:close_XSD_el {return {merged: false, ...close_el, content}})
              &{return check_elTags(el_name, prefix, close) && check_complexTypeMutex(attrs, close.content) && check_repeatedNames(el_name, /attribute(Group)?/, close.content)} {
  let complexType = {element: el_name, attrs, content: close.content}

  if (complexType.content.length > 0) {
    if (close.content[0].element == "mixed_restriction") {
      let new_complexType = close.content[0].content
      new_complexType.attrs.name = attrs.name
      complexTypes[attrs.name] = new_complexType
      return new_complexType
    }

    // só é uma referência a resolver se o conteúdo for simple/complexType e tiver uma base complexType
    if (close.content[0].element.includes("Content")) {
      // restrições de complexContent são resolvidas na queue de complexTypes
      if ("content" in close.content[0]) ct_queue[close.content[0].content[0].element].push(complexType)
      // restrições de simpleContent são resolvidas na queue de simpleTypes, porque são efetivamente restrições a simpleTypes
      else st_queue.simpleTypes[st_queue.simpleTypes.length - 1].complex = complexType
    }
    else if ("name" in attrs) complexTypes[attrs.name] = complexType
  }
  else if ("name" in attrs) complexTypes[attrs.name] = complexType

  if (!--type_depth) current_type = null
  attrGroups = attrsAPI.addAttrGroup(attrGroups, "name" in attrs ? attrs.name : null, el_name, complexType.content)
  return complexType
}

complexType_attrs = el:(elem_abstract / complexType_block / elem_final / elem_id / complex_mixed / complexType_name)* 
                    {return checkError(attrsAPI.check_localTypeAttrs(el, "complexType", schema_depth, curr))}

complexType_block = ws2 attr:"block" ws "=" q1:QMo val:elem_final_values q2:QMc                              {return checkQM(q1,q2,attr,val)}
complex_mixed = ws2 attr:"mixed" ws "=" q1:QMo val:boolean q2:QMc                                            {return checkQM(q1,q2,attr,val)}
complexType_name = ws2 attr:"name" ws "=" q1:QMo val:NCName q2:QMc    {val = newLocalType(val,"complexType"); return checkQM(q1,q2,attr,val)}

complexType_content = c:(comments annotation? (simpleContent / complexContent / ((all / choiceOrSequence / group)? attributes))) {return cleanContent(c.flat(2))}


// ----- <simpleContent> -----

simpleContent = comments prefix:open_XSD_el el_name:"simpleContent" attr:elem_id? ws openEl content:simpleContent_content close_el:close_XSD_el
                &{return check_elTags(el_name, prefix, {merged: false, ...close_el})} {
  let simpleType = {element: el_name, attrs: getAttrs(attr)}

  if (content[0].element == "mixed_restriction") return content
  if (content[0].element == "extension") simpleType.content = content
  else {
    // o nome de um simpleType nunca pode começar por algarismos, logo nunca coincide com um simpleType existente
    simpleType.attrs.name = "" + ++noNameST

    st_queue.simpleTypes.push({
      info: {name: simpleType.attrs.name, base: stAPI.get_base(content, default_prefix, simpleTypes)},
      args: [undefined, content],
      complex: true,
      ref: simpleType
    })
  }

  return simpleType
}

simpleContent_content = c:(comments annotation? (restrictionSC / extensionSC)) {return cleanContent(c)}


// ----- <complexContent> -----

complexContent = comments prefix:open_XSD_el el_name:$("complexContent" {any_type = "C"}) attrs:complexContent_attrs ws openEl content:complexContent_content close_el:close_XSD_el
                 &{return check_elTags(el_name, prefix, {merged: false, ...close_el})}
                 {return {element: el_name, attrs, content}}

complexContent_attrs = attrs:(complex_mixed elem_id? / elem_id complex_mixed?)? {return getAttrs(attrs)}

complexContent_content = c:(comments annotation? (restrictionCC / extensionCC)) {any_type = "BSC"; return cleanContent(c)}


// ----- <all> -----

all = comments prefix:open_XSD_el el_name:"all" attrs:all_attrs ws 
      close:(merged_close / openEl content:all_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) 
      &{return check_elTags(el_name, prefix, close) && check_repeatedNames(el_name, /element/, close.content)}
      {return {element: el_name, attrs, content: close.content}}

all_attrs = el:(elem_id / all_maxOccurs / all_minOccurs)* {return check_occursAttrs(el,"all")}

all_maxOccurs = ws2 attr:"maxOccurs" ws "=" q1:QMo val:"1"  q2:QMc {return checkQM(q1,q2,attr,parseInt(val))}
all_minOccurs = ws2 attr:"minOccurs" ws "=" q1:QMo val:[01] q2:QMc {return checkQM(q1,q2,attr,parseInt(val))}

all_content = c:(comments annotation? element*) {return cleanContent(c.flat())}


// ----- <choice/sequence> -----

choiceOrSequence = comments prefix:open_XSD_el el_name:$("choice"/"sequence") attrs:(a:choiceOrSeq_attrs {return check_occursAttrs(a, el_name)}) ws 
                   close:(merged_close / openEl content:choiceOrSeq_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) 
                   &{return check_elTags(el_name, prefix, close) && check_repeatedNames(el_name, /element/, close.content)}
                   {return {element: el_name, attrs, content: close.content}}

choiceOrSeq_attrs = el:(elem_id / elem_maxOccurs / elem_minOccurs)* {return el}

choiceOrSeq_content = c:(comments annotation? (element / choiceOrSequence / group / any)*) {return cleanContent(c.flat())}


// ----- <group> -----

group = comments prefix:open_XSD_el el_name:"group" attrs:group_attrs ws 
        close:(merged_close / openEl content:group_content close_el:close_XSD_el {return {merged: false, ...close_el, content}}) 
        &{return check_elTags(el_name, prefix, close)}
        {curr.group = false; return {element: el_name, attrs, content: check_groupContent(attrs, close.content)}}

group_attrs = el:(group_name / elem_id / elem_maxOccurs / elem_minOccurs / group_ref)* {
  let attrs = checkError(attrsAPI.check_groupAttrs(el, schema_depth, curr))
  getUnboundedMin(attrs)
  curr.group = true
  return attrs
}

group_name = ws2 attr:"name" ws "=" q1:QMo val:NCName q2:QMc           &{return validateName(val,"group")} {return checkQM(q1,q2,attr,val)}
group_ref = ws2 attr:"ref" ws "=" q1:QMo val:QName q2:QMc {queue.push({attr: "ref", args: [val, "group"]}); return checkQM(q1,q2,attr,val)}

group_content = c:(comments annotation? (all / choiceOrSequence)?) {return cleanContent(c)}


// ----- <notation> -----

notation = comments prefix:open_XSD_el el_name:"notation" attrs:notation_attrs ws close:(merged_close / ann_content)
          &{return check_elTags(el_name, prefix, close)}
          {return null} //{return {element: el_name, attrs, content: close.content}}

notation_attrs = el:(elem_id / notation_name / notation_URI_attrs)* {return checkError(attrsAPI.check_notationAttrs(el))}

notation_name = ws2 attr:"name" ws "=" q1:QMo val:NCName q2:QMc &{return validateName(val,"notation")} {return checkQM(q1,q2,attr,val)}
notation_URI_attrs = ws2 attr:("public" / "system") ws "=" ws val:string {return {attr, val}}


// ----- Comentário -----

comments = comment* {return null}
comment = "<!--" comment_content close_comment ws
comment_content = (!close_comment). comment_content*
close_comment = "-->"


// ----- Tipo DataGen -----

datagen_comment = "<!--datagen:" func:datagen_func args:datagen_args? "-->" ws {return {element: "datagen", ...func, args: args!==null ? args : "()"}}
datagen_func = datagen_boolean / datagen_integer / datagen_float / datagen_string

datagen_boolean = func:"boolean" {return {func, type: "boolean"}}
datagen_integer = func:("index"/"integer"/"integerOfSize") {return {func, type: "integer"}}
datagen_float = func:("float"/"multipleOf") {return {func, type: "float"}}
datagen_string = func:("date"/"formattedInteger"/"formattedFloat"/"guid"/"hexBinary"/"language"/"letter"/"lorem"/"objectID"/"pattern"/"position"/"pt_phone_number"/"stringOfSize"/"time"/"xsd_date"/"xsd_dateTime"/"xsd_duration"/"xsd_gDay"/"xsd_gMonth"/"xsd_gMonthDay"/"xsd_gYear"/"xsd_gYearMonth"/"xsd_string"/"actor"/"animal"/"brand"/"buzzword"/"capital"/"car_brand"/"continent"/"country"/"cultural_center"/"firstName"/"fullName"/"gov_entity"/"hacker"/"job"/"month"/"musician"/"nationality"/"political_party_abbr"/"political_party_name"/"pt_businessman"/"pt_city"/"pt_county"/"pt_district"/"pt_entity_abbr"/"pt_entity_name"/"pt_parish"/"pt_politician"/"pt_public_figure"/"pt_top100_celebrity"/"religion"/"soccer_club"/"soccer_player"/"sport"/"surname"/"top100_celebrity"/"weekday"/"writer") {return {func, type: "string"}}

datagen_args = "(" datagen_args_content? datagen_args_close ws {return text()}
datagen_args_content = (!datagen_args_close). datagen_args_content*
datagen_args_close = ")"


// ----- Regex recorrentes -----

openEl  = ">" ws {schema_depth++}
closeEl = ">" ws {schema_depth--}

open_XSD_el      = "<"  prefix:(p:NCName ":" {return p})? {return prefix}
close_XSD_prefix = "</" prefix:(p:NCName ":" {return p})? {return prefix}

merged_close = "/>" ws comments {return {merged: true, content: []}}

close_XSD_el = prefix:close_XSD_prefix name:XSD_el_name ws closeEl comments {return {name, prefix}}
ann_content = openEl comments content:annotation? close_el:close_XSD_el {return {merged: false, ...close_el, content: cleanContent(content)}}

attributes = c:((attribute / attributeGroup)* anyAttribute?) {return c.flat()}


// ----- Valores -----

QM = '"' / "'" // quotation mark sem whitespaces
QMo = ws qm:('"' / "'") ws {return qm} // quotation mark open
QMc = ws qm:('"' / "'") {return qm} // quotation mark close

boolean = true / false
false = "false" { return false }
true  = "true"  { return true }
null  = "null"  { return null }

int = integer:(("0"* i:([1-9] [0-9]*) {return i}) / (i:"0" "0"* {return i})) {return parseInt(Array.isArray(integer) ? integer.flat().join("") : integer)}

letter = [a-zA-Z]
letter1_8 = $(letter letter? letter? letter? letter? letter? letter? letter?)
string = ('"'[^"]*'"' / "'"[^']*"'") {return text().slice(1,-1)}

NCName = $(([a-zA-Z_]/[^\x00-\x7F])([a-zA-Z0-9.\-_]/[^\x00-\x7F])*)
QName = prefix:(p:NCName ":" {return existsPrefix(p)})? name:NCName {
  if (prefix === null) return name
  else {
    if (target_prefixes.includes(prefix)) return name
    else if (prefix == default_prefix) return error(`<b>${`${prefix}:${name}`}</b> não é um elemento válido da XMLSchema! Não estará a tentar referenciar um elemento local?`)
    else return error(`Esta aplicação suporta apenas referências à XMLSchema (prefixo <b>${default_prefix}</b>) e à schema local${target_prefixes.length>0 ? ` (prefixo <b>${target_prefixes[0]}</b>, opcional)` : ""}, por isso não consegue resolver a referência <b>${`${prefix}:${name}`}</b>!`)
  }
}

ID = id:NCName &{return validateID(id)} {ids.push(id); return id}
language = $((letter letter / [iI]"-"letter+ / [xX]"-"letter1_8)("-"letter1_8)?)

XSD_el_name = "include" / "import" / "redefine" / "notation" / "annotation" / "appinfo" / "documentation" / 
              "element" / "field" / "selector" / "key" / "keyref" / "unique" / 
              "attributeGroup" / "attribute" / "anyAttribute" / 
              "simpleType" / "union" / "list" / "restriction" / "extension" / constrFacet_values /
              "complexType" / "simpleContent" / "complexContent" / "all" / "choice" / "group" / "sequence" / "any"


// ----- Valores simples de atributos -----

form_values = $("un"?"qualified")
use_values = "optional" / "prohibited" / "required"
processContents_values = "lax" / "skip" / "strict"
constrFacet_values = $("length" / ("max"/"min")"Length" / ("max"/"min")("Ex"/"In")"clusive" / ("total"/"fraction")"Digits" / "whiteSpace" / "pattern" / "enumeration")

// um tipo válido tem de ser um dos seguintes: tipo built-in (com ou sem prefixo da schema); tipo de outra schema importada, com o prefixo respetivo; simple/complexType local
type_value = type:(p:NCName ":" name:NCName &{return existsPrefix(p)} {
  if (!target_prefixes.includes(p) && p != default_prefix) return error(`Esta aplicação suporta apenas referências à XMLSchema (prefixo <b>${default_prefix}</b>) e à schema local${target_prefixes.length>0 ? ` (prefixo <b>${target_prefixes[0]}</b>, opcional)` : ""}, por isso não consegue resolver a referência <b>${`${p}:${name}`}</b>!`)
  queue.push({attr: "type", args: [name, p, any_type, current_type, Object.values(curr).some(x=>x)]})
  return {p: target_prefixes.includes(p) ? null : p, name}
} / name:NCName {
  queue.push({attr: "type", args: [name, null, any_type, current_type, Object.values(curr).some(x=>x)]})
  if (name in modTypeNames) name = modTypeNames[name]
  return {p: null, name}
}) {
  return ((type.p === null || target_prefixes.includes(type.p)) ? "" : (type.p + ":")) + type.name
}


// ----- Listas de valores de atributos -----

finalDefault_values = "#all" / finalDefault_listOfValues
finalDefault_list_val = "extension" / "restriction" / "list" / "union"
finalDefault_listOfValues = l:$(finalDefault_list_val (ws2 finalDefault_list_val)*) &{return validate_listOfValues(l, 'O valor do atributo <b>finalDefault</b> deve corresponder a (#all | Lista de (extension | restriction | list | union))!')}

elem_final_values = "#all" / "extension" ws "restriction" / "restriction" ws "extension" / "extension" / "restriction"

list_types = ws fst:type_value? others:(ws2 n:type_value {return n})* ws {if (fst !== null) others.unshift(fst); return others}

block_values = "#all" / block_listOfValues
block_list_val = "extension" / "restriction" / "substitution"
block_listOfValues = l:$(block_list_val (ws2 block_list_val)*) &{return validate_listOfValues(l, 'O valor do atributo<b>"block</b> deve corresponder a (#all | Lista de (extension | restriction | substitution))!')}

simpleType_final_values = "#all" / simpleType_final_listOfValues
simpleType_final_list_val = "list" / "union" / "restriction"
simpleType_final_listOfValues = l:$(simpleType_final_list_val (ws2 simpleType_final_list_val)*) &{return validate_listOfValues(l, 'O valor do atributo <b>final</b> do elemento <b>&#60;simpleType&#62;</b> deve corresponder a (#all | Lista de (list | union | restriction))!')}


namespace_values = (namespace_values_Q / namespace_values_A) {return text().slice(1,-1)}
namespace_values_Q = $('"' ws ("##any" / "##other" / l:namespace_listOfValues_Q &{return check_namespace(l)}) ws '"')
namespace_values_A = $("'" ws ("##any" / "##other" / l:namespace_listOfValues_A &{return check_namespace(l)}) ws "'")

namespace_list_val_Q = "##local" / "##targetNamespace" / $((!("##"/'"')). [^ "\t\n\r]+) // a string é um URI
namespace_list_val_A = "##local" / "##targetNamespace" / $((!("##"/"'")). [^ '\t\n\r]+) // a string é um URI

namespace_listOfValues_Q = $(namespace_list_val_Q (ws2 namespace_list_val_Q)*)
namespace_listOfValues_A = $(namespace_list_val_A (ws2 namespace_list_val_A)*)


// ----- XPath -----

selectorXPath = $(path ('|' path)*)
path = ('.//')? step ('/' step)*
fieldXPath = $(('.//')? (step '/')* (step / '@' nameTest))
step = '.' / nameTest  
nameTest = QName / '*' / NCName ':' '*'  