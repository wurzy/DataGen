const loremIpsum = require("lorem-ipsum").loremIpsum;

function randomize(min, max) { return Math.floor(Math.random() * ((max+1) - min) + min) }


// JSON -> JSON --------------------------------------------------------------------------------------------------------

function denormalizeNameJSON(prop, prop_name) {
    return /^DFXS_NORMALIZED/.test(prop) ? prop_name.replace(/__(DOT|HYPHEN)__/g, "_") : prop_name
}

function renameProperty(o, old_key, new_key) {
    Object.defineProperty(o, new_key, Object.getOwnPropertyDescriptor(o, old_key))
    delete o[old_key]
    return o
}

function cleanEmptyObjects(json) {
    let keys = Object.keys(json)

    for (let i = 0; i < keys.length; i++) {
        if (keys[i] == "DFJS_EMPTY_OBJECT") delete json[keys[i]]
        else if (typeof json[keys[i]] == "object" && json[keys[i]] != null) cleanEmptyObjects(json[keys[i]])
    }
    return json
}


function cleanJson(json) {
    let dataset = cleanJson2(json, {}, null, 0)
    if (Array.isArray(dataset)) dataset = cleanEmptyObjects(dataset)
    return dataset
}

function cleanJson2(json, dataset, flatten_map, depth) {
    let keys = Object.keys(json), temp = "", last_attr = -1 // se for mixed, para só escrever texto entre partículas depois dos atributos
    let mixed = {bool: false, content: null, counter: 1}

    keys.map((k,i) => {if (/^DFXS(_NORMALIZED)?_ATTR__/.test(k)) last_attr = i})

    for (let i = 0; i < keys.length; i++) {
        let prop = keys[i]

        if (prop == "DFJS_EMPTY_OBJECT") ;
        else if (prop == "DFJS_NOT_OBJECT") return json[prop]
        else if (/^DFXS_TEMP__\d+/.test(prop)) cleanJson2(json[prop], dataset, flatten_map, depth+1)
        else if (/^DFXS_MIXED_/.test(prop)) {
            mixed.bool = true
            if (prop == "DFXS_MIXED_RESTRICTED") mixed.content = json[prop]
        }
        else if (/^DFXS_SIMPLE_CONTENT/.test(prop)) {
            if (Object.keys(json).length == 1) {
                dataset[prop] = json[prop]
                temp = prop
            }
            else dataset.value = json[prop]
        }
        else if (/^DFXS_FLATTEN__\d+/.test(prop)) {
            let keys_map = flatten_map !== null ? flatten_map : {}
            let temp_dataset = {}

            json[prop].map(obj => {
                let res = cleanJson2(obj, temp_dataset, keys_map, depth+1)
                keys_map = res.flatten_map
            })
            
            for (let p in temp_dataset) {
                if (flatten_map !== null) dataset[p] = temp_dataset[p]
                else {
                    let original_p = p.replace(/_\d+$/, "")
                    let final_p = keys_map[original_p]==1 ? original_p : p.replace(/_\d+$/, m => m.slice(1))
                    dataset[final_p] = temp_dataset[p]
                }
            }
            
            if (!json[prop].length || (json[prop].length==1 && !Object.keys(json[prop][0]).length)) delete json[prop]
        }
        else {
            if (/^DFXS(_NORMALIZED)?_ATTR__/.test(prop)) {
                let prop_name = denormalizeNameJSON(prop, prop.replace(/^DFXS(_NORMALIZED)?_ATTR__/, "attr_"))
                dataset[prop_name] = json[prop]
            }
            else {
                let prop_name = prop
                if (/^DFXS_NORMALIZED_ELEM__/.test(prop)) prop_name = denormalizeNameJSON(prop, prop.replace(/^DFXS_NORMALIZED?_ELEM__/, ""))

                if (flatten_map !== null) {
                    if (!(prop_name in flatten_map)) flatten_map[prop_name] = 0
                    prop_name += "_" + ++flatten_map[prop_name]
                }
                
                if (typeof json[prop] == "object" && json[prop] != null) {
                    dataset[prop_name] = Array.isArray(json[prop]) ? [] : {}
                    let res = cleanJson2(json[prop], dataset[prop_name], null, depth+1)
                    dataset[prop_name] = res.temp.length > 0 ? res.dataset[res.temp] : res.dataset
                }
                else dataset[prop_name] = json[prop]
            }
        }
        
        if (prop in json && mixed.bool && i >= last_attr) {
            let mixed_content = mixed.content !== null ? mixed.content : loremIpsum({ count: randomize(3,10), units: "words" })
            dataset["text" + mixed.counter++] = mixed_content
        }
    }

    if (mixed.bool) {
        let keys = Object.keys(dataset)
        if (keys.length == 1 && keys[0] == "text1") temp = "text1"
        else if (keys.filter(k => !/^attr_/.test(k)).length == 1) dataset = renameProperty(dataset, "text1", "text")
    }

    return !depth ? dataset : {dataset, temp, flatten_map}
}


// JSON -> XML --------------------------------------------------------------------------------------------------------

function denormalizeNameXML(prop, prop_name) {
    return /^DFXS_NORMALIZED/.test(prop) ? prop_name.replace(/__DOT__/g, ".").replace(/__HYPHEN__/g, "-") : prop_name
}

function convertXMLString(input, outputFormat, depth) {
    var xml = '\t'.repeat(depth)
    
    if (input === null) xml += "null"
    else if (typeof input === 'string') {
        if (outputFormat === 'xml') {
            xml += input.replace(/(&)/g, '&amp;').replace(/(<)/g, '&lt;').replace(/(>)/g, '&gt;').replace(/(')/g, '&apos;')
        }
        else if (outputFormat === 'string') {
            xml += input.replace(/(&lt;)/g, '<').replace(/(&gt;)/g, '>').replace(/(&apos;)/g, "'").replace(/(&amp;)/g, '&')
        }
    }
    else xml += input

    return xml + '\n' //not a string
}


function jsonToXml(obj, settings) {
    let xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>'
    if (settings !== undefined) {
        if ("xml_declaration" in settings) xml_declaration = settings.xml_declaration
        if ("root_name" in settings) {
            let key = "DFJS_NOT_OBJECT"
            let xml = xml_declaration + `\n<${settings.root_name}>`

            if (Object.keys(obj)[0] == key) {
                if (Array.isArray(obj[key])) xml += "\n" //arrays
                if (typeof obj[key] == "string" && obj[key].length > 100) xml += "\n" //tipos elementares
            }
            else if (typeof obj == "object") xml += "\n" //objetos
            
            return xml + jsonToXml2(obj,1,null) + `</${settings.root_name}>`
        }
    } 
    return xml_declaration + "\n" + jsonToXml2(obj,0,null)
}

function jsonToXml2(obj, depth, mix) {
    let xml = ''
    let mixed = mix !== null ? mix : {bool: false, content: null}
    let keys = Object.keys(obj)

    // se for mixed, para só escrever texto entre partículas depois dos atributos
    let last_attr = -1
    keys.map((k,i) => {if (/^DFXS(_NORMALIZED)?_ATTR__/.test(k)) last_attr = i})

    let i = 0
    for (var prop in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, prop) || (obj[prop] != null && obj[prop] == undefined)) continue
        if (prop == "DFXS_EMPTY_XML") return xml

        if (/^DFXS_MIXED_/.test(prop)) {
            mixed.bool = true
            if (prop == "DFXS_MIXED_RESTRICTED") mixed.content = obj[prop]
        }
        else if (/^DFXS_TEMP__\d+/.test(prop)) xml += jsonToXml2(obj[prop], depth, mixed.bool ? mixed : null)
        else if (/^DFXS_FLATTEN__\d+/.test(prop)) xml += obj[prop].reduce((str,cur) => str += jsonToXml2(cur, depth, mixed.bool ? mixed : null), "")
        else if (/^DFXS_SIMPLE_CONTENT/.test(prop)) xml += '\t'.repeat(depth) + obj[prop] + '\n'
        else {
            let prop_name = prop

            if (/^DFXS(_NORMALIZED)?_ATTR__/.test(prop)) {
                prop_name = prop.replace(/^DFXS(_NORMALIZED)?_ATTR__/, "")
                prop_name = denormalizeNameXML(prop, prop_name)

                let qm = (typeof obj[prop] == "string" && obj[prop].includes('"')) ? "'" : '"'
                xml = `${xml.slice(0, -2)} ${prop_name}=${qm}${obj[prop]}${qm}>\n`
            }
            else {
                if (prop_name == "DFJS_EMPTY_OBJECT") return xml
                if (/^DFXS(_NORMALIZED)?_(\d+|ELEM)__/.test(prop)) {
                    prop_name = prop.replace(/^DFXS(_NORMALIZED)?_(\d+|ELEM)__/, "")
                    prop_name = denormalizeNameXML(prop, prop_name)
                }
            
                if (prop_name != "DFJS_NOT_OBJECT") xml += '\t'.repeat(depth) + "<" + (Array.isArray(obj) ? `elem_${parseInt(prop)+1}` : prop_name) + ">\n"
                let onlyAttrs = false, empty = false, newlineClose = true, next_depth = depth + (prop_name != "DFJS_NOT_OBJECT" ? 1 : 0)
                
                if (typeof obj[prop] == "object" && obj[prop] != null) {
                    let child_keys = Object.keys(obj[prop])

                    empty = !child_keys.length
                    onlyAttrs = child_keys.length > 0 && child_keys.every(k => /^DFXS(_NORMALIZED)?_ATTR__/.test(k))

                    let content = jsonToXml2(obj[prop], next_depth, mixed.bool ? mixed : null)
                    if (content[0] == " ") xml = xml.slice(0, -2) // atributos
                    xml += content
                }
                else {
                    let value = convertXMLString(obj[prop], 'xml', next_depth)
                    
                    if (typeof obj[prop] == "string" && obj[prop].length > 100) xml += value
                    else {
                        xml = xml.slice(0, -1) + value.slice(0, -1).replace(/^\t*/, "")
                        newlineClose = false
                    }
                }

                if (prop_name != "DFJS_NOT_OBJECT") {
                    // abreviar elementos só com atributos ou sem conteúdo
                    if (empty) xml = xml.slice(0,-2) + "/>\n"
                    if (!empty && !onlyAttrs) {
                        xml += newlineClose ? '\t'.repeat(depth) : ""
                        xml += "</" + (Array.isArray(obj) ? `elem_${parseInt(prop)+1}` : prop_name) + ">\n"
                    }
                }
            }
        }

        if (mixed.bool && i >= last_attr) {
            let mixed_content = mixed.content !== null ? mixed.content : loremIpsum({ count: randomize(3,10), units: "words" })
            xml += '\t'.repeat(depth) + mixed_content + "\n"
        }
        i++
    }

    // abreviar elementos só com atributos
    if (keys.length > 0 && keys.every(prop => /^DFXS(_NORMALIZED)?_ATTR__/.test(prop))) xml = xml.slice(0, -2) + "/>\n"
    return xml
}


// JSON -> STRAPI --------------------------------------------------------------------------------------------------------

function jsonToStrapi(obj) {
    var res = {}
  
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) res["elem"+i] = jsonToStrapi(obj[i])
    }
    else if (typeof obj == "object" && obj != null) {
      for (var prop in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, prop) || (obj[prop] != null && obj[prop] == undefined)) continue
  
          if (Array.isArray(obj[prop])) res[prop] = jsonToStrapi(obj[prop])
          else if (typeof obj[prop] == "object" && obj[prop] != null) res[prop] = jsonToStrapi(obj[prop])
          else res[prop] = obj[prop]
      }
    }
    else res = obj
  
    return res
}



// JSON -> CSV --------------------------------------------------------------------------------------------------------

const objectDepth = (o) => Object (o) === o ? 1 + Math.max(-1, ...Object.values(o).map(objectDepth)) : 0

function jsonToCsv(obj, ids) {
    let str = ""
    const errorDepth = k => `A conversão para CSV só é possível para coleções sem aninhamento de dados nos seus elementos e, neste caso, a coleção "${k}" não cumpre esse requisito! As coleções devem também ser estruturadas com a primitiva 'repeat'.`
    const errorRepeat = k => `A conversão para CSV só é possível para coleções estruturadas com a primitiva 'repeat' e, neste caso, a coleção "${k}" não cumpre esse requisito! As coleções também não pode ter aninhamento de dados nos seus elementos.`
    
    for (let k in obj.data) {
        if (!(k in ids)) return {error: errorRepeat(k)}

        let depth = objectDepth(obj.data[k])
        let modelKey = ids[k]
        
        if (depth > 2) return {error: errorDepth(k)}
        if (depth < 2 || !("attributes" in obj.model[modelKey])) return {error: errorRepeat(k)}

        let keys = Object.keys(obj.model[modelKey].attributes)
        if (!keys.length) return {error: errorRepeat(k)}

        if (str.length > 0) str += "\n"
        str += keys.join(",") + "\n"

        for (let i = 0; i < obj.data[k].length; i++) {
            for (let j = 0; j < keys.length; j++) {
                if (keys[j] in obj.data[k][i]) {
                    if (typeof obj.data[k][i][keys[j]] == "string") str += '"' + obj.data[k][i][keys[j]].replace(/"/g, '""') + '"'
                    else str += obj.data[k][i][keys[j]]
                }
                if (j < keys.length-1) str += ","
            }
            str += "\n"
        }
    }

    return str
}

module.exports = { cleanJson, jsonToXml, jsonToStrapi, jsonToCsv }