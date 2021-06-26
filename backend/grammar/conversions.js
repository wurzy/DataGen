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

module.exports = { jsonToXml, jsonToStrapi }