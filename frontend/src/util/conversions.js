const loremIpsum = require("lorem-ipsum").loremIpsum;

function randomize(min, max) { return Math.floor(Math.random() * ((max+1) - min) + min) }

function jsonToXml(obj, xml_declaration) {
    if (xml_declaration === undefined) xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>'
    return xml_declaration + "\n" + jsonToXml2(obj,0)
}

function denormalizeNameXSD(prop, prop_name) {
    if (/^DFS_NORMALIZED/.test(prop)) prop_name = prop_name.replace(/__DOT__/g, ".").replace(/__HYPHEN__/g, "-")
    return prop_name
}

function jsonToXml2(obj, depth) {
    var xml = ''
    var mixed = {bool: false, content: null}
    let keys = Object.keys(obj)

    // se for mixed, para só escrever texto entre partículas depois dos atributos
    let last_attr = -1
    for (let i = 0; i < keys.length; i++) {
        if (/^DFS(_NORMALIZED)?_ATTR__/.test(keys[i])) last_attr = i
    }

    let i = 0
    for (var prop in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, prop) || (obj[prop] != null && obj[prop] == undefined)) continue
        
        if (prop == "DFS_EMPTY_XML") return xml

        if (/^DFS_MIXED_/.test(prop)) {
            mixed.bool = true
            if (prop == "DFS_MIXED_RESTRICTED") mixed.content = obj[prop]
        }
        else if (/^DFS_TEMP__\d+/.test(prop)) xml += jsonToXml2(obj[prop], depth)
        else if (/^DFS_EXTENSION__SC/.test(prop)) xml += '\t'.repeat(depth) + obj[prop] + '\n'
        else {
            let prop_name = prop

            if (/^DFS(_NORMALIZED)?_ATTR__/.test(prop)) {
                prop_name = prop.replace(/^DFS(_NORMALIZED)?_ATTR__/, "")
                prop_name = denormalizeNameXSD(prop, prop_name)
                
                let qm = (typeof obj[prop] == "string" && obj[prop].includes('"')) ? "'" : '"'
                xml = `${xml.slice(0, -2)} ${prop_name}=${qm}${obj[prop]}${qm}>\n`
            }
            else {   
                if (/^DFS(_NORMALIZED)?_\d+__/.test(prop)) {
                    prop_name = prop.replace(/^DFS(_NORMALIZED)?_\d+__/, "")
                    prop_name = denormalizeNameXSD(prop, prop_name)
                }
            
                xml += '\t'.repeat(depth) + "<" + (Array.isArray(obj) ? `elem_${parseInt(prop)+1}` : prop_name) + ">\n"
                let onlyAttrs = false, empty = false

                if (typeof obj[prop] == "object" && obj[prop] != null) {
                    let child_keys = Object.keys(obj[prop])

                    empty = !child_keys.length
                    onlyAttrs = child_keys.length > 0 && child_keys.every(k => /^DFS(_NORMALIZED)?_ATTR__/.test(k))

                    let content = jsonToXml2(obj[prop], depth+1)
                    if (content[0] == " ") xml = xml.slice(0, -2) // atributos
                    xml += content
                }
                else xml += convertXMLString(obj[prop], 'xml', depth+1)

                // abreviar elementos só com atributos ou sem conteúdo
                if (empty) xml = xml.slice(0,-2) + "/>\n"
                if (!empty && !onlyAttrs) xml += '\t'.repeat(depth) + "</" + (Array.isArray(obj) ? `elem_${parseInt(prop)+1}` : prop_name) + ">\n"
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

module.exports = { jsonToXml, jsonToStrapi, jsonToCsv }