function jsonToXml(obj) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + jsonToXml2(obj,0)
}

function jsonToXml2(obj, depth) {
    var xml = ''

    for (var prop in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, prop) || (obj[prop] != null && obj[prop] == undefined)) continue

        xml += '\t'.repeat(depth) + "<" + (Array.isArray(obj) ? `elem_${parseInt(prop)+1}` : prop) + ">\n"
        if (typeof obj[prop] == "object" && obj[prop] != null) xml += jsonToXml2(obj[prop], depth+1)
        else xml += convertXMLString(obj[prop], 'xml', depth+1)
        xml += '\t'.repeat(depth) + "</" + (Array.isArray(obj) ? `elem_${parseInt(prop)+1}` : prop) + ">\n"
    }

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
        str += k + "\n" + keys.join(",") + "\n"

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