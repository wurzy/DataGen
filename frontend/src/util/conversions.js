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

const objectDepth = (o) => Object (o) === o ? 1 + Math .max (-1, ... Object .values(o) .map (objectDepth)) : 0

function jsonToCsv(obj) {
    if (Object.keys(obj.data).length > 1) return 0

    let modelKey = Object.keys(obj.model)[0],
        dataKey = Object.keys(obj.data)[0],
        data = obj.data[dataKey]
        
    if (objectDepth(data) > 2) return 1
    if (objectDepth(data) < 2) return 2
    if (!("attributes" in obj.model[modelKey])) return 2

    let keys = Object.keys(obj.model[modelKey].attributes)
    let str = dataKey + "\n" + keys.join(",") + "\n"

    if (!keys.length) return 2

    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < keys.length; j++) {
            if (keys[j] in data[i]) {
                if (typeof data[i][keys[j]] == "string") str += '"' + data[i][keys[j]].replace(/"/g, '""') + '"'
                else str += data[i][keys[j]]
            }
            if (j < keys.length-1) str += ","
        }
        str += "\n"
    }

    return str
}

module.exports = { jsonToXml, jsonToStrapi, jsonToCsv }