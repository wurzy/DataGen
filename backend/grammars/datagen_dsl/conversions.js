const utils = require('./DFS_utils')
const loremIpsum = require("lorem-ipsum").loremIpsum;

function randomize(min, max) { return Math.floor(Math.random() * ((max+1) - min) + min) }


// JSON -> JSON --------------------------------------------------------------------------------------------------------

function denormalizeNameJSON(prop, prop_name) {
    return /^DFS_NORMALIZED/.test(prop) ? prop_name.replace(/__(DOT|HYPHEN)__/g, "_") : prop_name
}

function renameProperty(o, old_key, new_key) {
    Object.defineProperty(o, new_key, Object.getOwnPropertyDescriptor(o, old_key))
    delete o[old_key]
    return o
}

function parseKeyJSON(original, keys_counter) {
    let key = original.replace(/^DFS(_NORMALIZED)?_/, "")
    let iter = parseInt(key)
    key = key.replace(/^\d+__/, "")
    
    if (key in keys_counter) keys_counter[key].count++
    else keys_counter[key] = {count: 1, map: {}}

    if (iter != keys_counter[key].count) iter = keys_counter[key].count
    keys_counter[key].map[original] = denormalizeNameJSON(original, key) + iter

    return keys_counter
}

function callUtils(obj, prop) {
    let func = prop.replace(/^DFS_UTILS__/, "")
    let args = func == "list" ? [obj[prop]] : obj[prop].split(";")
    return utils[func](...args)
}


function cleanJson(json) {
    // condição para evitar processamento desnecessário, se não for um JSON a partir de XML Schema
    return /^DFS(_NORMALIZED)?_\d+__/.test(Object.keys(json)[0]) ? cleanJson2(json,0) : json
}

function cleanJson2(json, depth) {
    let last_attr = -1 // se for mixed, para só escrever texto entre partículas depois dos atributos
    let keys = Object.keys(json), keys_counter = {}

    for (let i = 0; i < keys.length; i++) {
        if (/^DFS(_NORMALIZED)?_ATTR__/.test(keys[i])) last_attr = i
        if (/^DFS(_NORMALIZED)?_\d+__/.test(keys[i])) keys_counter = parseKeyJSON(keys[i], keys_counter)
    }

    let temp = "", new_props = []
    var mixed = {bool: false, content: null, counter: 1}

    for (let i = 0; i < keys.length || new_props.length > 0;) {
        let normal_key = !new_props.length
        let prop = new_props.length > 0 ? new_props.shift() : keys[i]
        let prop_name = prop
        
        if (prop == "DFS_EMPTY_XML") delete json[prop]
        
        if (/^DFS_MIXED_/.test(prop)) {
            mixed.bool = true
            if (prop == "DFS_MIXED_RESTRICTED") mixed.content = checkUtilsProp(json[prop])
            delete json[prop]
        }
        else if (/^DFS_TEMP__\d+/.test(prop)) {
            let new_keys = Object.keys(json[prop])

            // aqui as chaves ficam com contador 1 mesmo que sejam únicas, senão era preciso estar a reescrever mais propriedades mais tarde para preservar a ordem
            // e não compensa o tempo extra de computação por um caso tão niche
            for (let j = 0; j < new_keys.length; j++) {
                if (/^DFS(_NORMALIZED)?_\d+__/.test(new_keys[j])) {
                    keys_counter = parseKeyJSON(new_keys[j], keys_counter)

                    let key = new_keys[j].replace(/^DFS(_NORMALIZED)?_\d+__/, "")
                    let new_prop = keys_counter[key].map[new_keys[j]]

                    json[new_prop] = json[prop][new_keys[j]]
                    new_props.push(new_prop)
                }
            }
            delete json[prop]
        }
        else if (/^DFS_EXTENSION__SC/.test(prop)) {
            if (typeof json[prop] === 'object' && json[prop] != null) {
                let key = Object.keys(json[prop])[0]
                json[prop] = callUtils(json[prop], key)
            }
            
            if (Object.keys(json).length == 1) temp = prop
            else json = renameProperty(json, prop, "value")
        }
        else if (/^DFS_UTILS__/.test(prop)) {
            temp = prop
            json[prop] = callUtils(json, prop)
        }
        else {
            if (/^DFS(_NORMALIZED)?_ATTR__/.test(prop)) {
                prop_name = prop.replace(/^DFS(_NORMALIZED)?_ATTR__/, "attr_")
                prop_name = denormalizeNameJSON(prop, prop_name)

                if (typeof json[prop] === 'object' && json[prop] != null) {
                    let key = Object.keys(json[prop])[0]
                    json[prop] = callUtils(json[prop], key)
                }
                json = renameProperty(json, prop, prop_name)
            }
            else { 
                if (typeof json[prop] == "object" && json[prop] != null) {
                    let res = cleanJson2(json[prop], depth+1)
                    json[prop] = res.temp.length > 0 ? res.json[res.temp] : res.json
                }

                if (/^DFS(_NORMALIZED)?_\d+__/.test(prop)) {
                    let key = prop.replace(/^DFS(_NORMALIZED)?_\d+__/, "")
                    prop_name = keys_counter[key].map[prop]
                    if (keys_counter[key].count == 1) prop_name = prop_name.slice(0,-1)
                    json = renameProperty(json, prop, prop_name)
                }
            }
        }

        if (mixed.bool && i >= last_attr) {
            let mixed_content = mixed.content !== null ? mixed.content : loremIpsum({ count: randomize(3,10), units: "words" })
            let mixed_key = "text" + ((mixed.counter == 1 && !(i+1 < keys.length || new_props.length)) ? "" : mixed.counter++)
            json[mixed_key] = mixed_content
        }
        if (normal_key) i++
    }

    return !depth ? json : {json, temp}
}


// JSON -> XML --------------------------------------------------------------------------------------------------------

let last_dfsUtils = false

function denormalizeNameXML(prop, prop_name) {
    return /^DFS_NORMALIZED/.test(prop) ? prop_name.replace(/__DOT__/g, ".").replace(/__HYPHEN__/g, "-") : prop_name
}

function checkUtilsProp(value) {
    return (typeof value === 'object' && value != null) ? callUtils(value, Object.keys(value)[0]) : value
}

function convertXMLString(input, outputFormat, depth) {
    var xml = '\t'.repeat(depth)
    
    if (input == null) xml += "null"
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


function jsonToXml(obj, xml_declaration) {
    if (xml_declaration === undefined) xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>'
    return xml_declaration + "\n" + jsonToXml2(obj,0)
}

function jsonToXml2(obj, depth) {
    var xml = ''
    var mixed = {bool: false, content: null}
    let keys = Object.keys(obj)

    // se for mixed, para só escrever texto entre partículas depois dos atributos
    let last_attr = -1
    keys.map((k,i) => {if (/^DFS(_NORMALIZED)?_ATTR__/.test(k)) last_attr = i})

    let i = 0
    for (var prop in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, prop) || (obj[prop] != null && obj[prop] == undefined)) continue
        
        if (prop == "DFS_EMPTY_XML") return xml

        if (/^DFS_MIXED_/.test(prop)) {
            mixed.bool = true
            if (prop == "DFS_MIXED_RESTRICTED") mixed.content = checkUtilsProp(obj[prop])
        }
        else if (/^DFS_TEMP__\d+/.test(prop)) xml += jsonToXml2(obj[prop], depth)
        else if (/^DFS_EXTENSION__SC/.test(prop)) xml += '\t'.repeat(depth) + checkUtilsProp(obj[prop]) + '\n'
        else if (/^DFS_UTILS__/.test(prop)) {
            xml += convertXMLString(callUtils(obj, prop), 'xml', depth)
            last_dfsUtils = true
        }
        else {
            let prop_name = prop

            if (/^DFS(_NORMALIZED)?_ATTR__/.test(prop)) {
                prop_name = prop.replace(/^DFS(_NORMALIZED)?_ATTR__/, "")
                prop_name = denormalizeNameXML(prop, prop_name)
                let value = checkUtilsProp(obj[prop])

                let qm = (typeof obj[prop] == "string" && value.includes('"')) ? "'" : '"'
                xml = `${xml.slice(0, -2)} ${prop_name}=${qm}${value}${qm}>\n`
            }
            else {   
                if (/^DFS(_NORMALIZED)?_\d+__/.test(prop)) {
                    prop_name = prop.replace(/^DFS(_NORMALIZED)?_\d+__/, "")
                    prop_name = denormalizeNameXML(prop, prop_name)
                }
            
                xml += '\t'.repeat(depth) + "<" + (Array.isArray(obj) ? `elem_${parseInt(prop)+1}` : prop_name) + ">\n"
                let onlyAttrs = false, empty = false, newlineClose = true
                
                if (typeof obj[prop] == "object" && obj[prop] != null) {
                    let child_keys = Object.keys(obj[prop])

                    empty = !child_keys.length
                    onlyAttrs = child_keys.length > 0 && child_keys.every(k => /^DFS(_NORMALIZED)?_ATTR__/.test(k))

                    let content = jsonToXml2(obj[prop], depth+1)
                    if (content[0] == " ") xml = xml.slice(0, -2) // atributos
                    
                    if (content[0] != " " && last_dfsUtils) {
                        if (content.length > 100) xml += content
                        else {
                            xml = xml.slice(0, -1) + content.slice(0, -1).replace(/^\t*/, "")
                            newlineClose = false
                        }
                        last_dfsUtils = false
                    }
                    else xml += content
                }
                else {
                    let value = convertXMLString(obj[prop], 'xml', depth+1)
                    
                    if (obj[prop].length > 100) xml += value
                    else {
                        xml = xml.slice(0, -1) + value.slice(0, -1).replace(/^\t*/, "")
                        newlineClose = false
                    }
                }

                // abreviar elementos só com atributos ou sem conteúdo
                if (empty) xml = xml.slice(0,-2) + "/>\n"
                if (!empty && !onlyAttrs) {
                    xml += newlineClose ? '\t'.repeat(depth) : ""
                    xml += "</" + (Array.isArray(obj) ? `elem_${parseInt(prop)+1}` : prop_name) + ">\n"
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
    if (keys.length > 0 && keys.every(prop => /^DFS(_NORMALIZED)?_ATTR__/.test(prop))) xml = xml.slice(0, -2) + "/>\n"
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