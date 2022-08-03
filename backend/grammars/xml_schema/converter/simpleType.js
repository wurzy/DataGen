// Funções auxiliares ----------

let indent = depth => '\t'.repeat(depth)

function convertDSLToFunction(str) {
   if (/{DFXS_ID(REF)?}/.test(str)) return '"'+str+'"'
   if (/^{{time/.test(str) && str.includes(".")) {
      str = str.split(".").map(x => x.slice(2,-2))
      return `gen.${str[0]}+"."+gen.${str[1]}`
   }
   if (/^-/.test(str)) {
      str = str.split("{{")
      return `"${str[0]}"+gen.${str[1].slice(0,-2)}`
   }
   if (/^{{/.test(str)) return `gen.${str.slice(2,-2)}`
}

// Funções de tradução de tipos embutidos ----------

function parseStringType(c, base, has) { 
   let min = null, max = null

   if (has("length")) {min = c.length; max = c.length}
   if (has("maxLength")) max = c.maxLength
   if (has("minLength")) min = c.minLength

   if (max === null && min == null) {min = 10; max = 50}
   else if (min == null) min = max > 1 ? 1 : 0
   else if (max == null) max = min + 50

   let length = min == max ? min : `${min},${max}`
   
   if (base == "hexBinary") return `{{hexBinary(${length})}}`
   if (["normalizedString","string","token"].includes(base)) return `{{stringOfSize(${length})}}`
   return `{{xsd_string("${base}",${length})}}`
}
 
function parseNumberType(c, base, has) {
   // verificar se o tipo-base é um tipo de números inteiros
   let intBase = () => !["decimal","double","float"].includes(base)

   let min = null, max = null
   
   // número máximo de casas decimais - se frac == total == 1, os números não poderão ter casas decimais
   let frac = has("fractionDigits") ? c.fractionDigits : 0
   if (has("totalDigits") && c.totalDigits == 1) frac = 0

   if (has("maxInclusive")) max = c.maxInclusive
   if (has("minInclusive")) min = c.minInclusive
   if (has("maxExclusive")) max = c.maxExclusive - (intBase() ? 1 : 0.1)
   if (has("minExclusive")) min = c.minExclusive + (intBase() ? 1 : 0.1)

   if (has("totalDigits")) {
      let maxPerTD = parseInt('9'.repeat(c.totalDigits)), minPerTD = -maxPerTD

      if (max === null || maxPerTD < max) max = maxPerTD
      if (min === null || minPerTD > min) min = minPerTD
   }
   
   // se a este ponto ainda não tiver ambos valores de max e min, atribuir valores default
   if (max === null && min === null) {max = 99999; min = -99999}
   else if (max === null) max = min + 100000
   else if (min === null) min = max - 100000

   if (!frac) return `{{${["double","float"].includes(base) ? "float" : "integer"}(${min}, ${max})}}`
   return `{{float(${min}, ${max}, ${frac})}}`
}
 
function parseSimpleGType(c, base, has) {
    let aux = {
       gDay: x => parseInt(x.substring(3,5)),
       gMonth: x => parseInt(x.substring(2,4)),
       gYear: x => parseInt(x.match(/\-?\d+/))
    }
 
    let max = null, min = null
 
    if (has("maxInclusive")) max = aux[base](c.maxInclusive)
    if (has("minInclusive")) min = aux[base](c.minInclusive)
    if (has("maxExclusive")) max = aux[base](c.maxExclusive) - 1
    if (has("minExclusive")) min = aux[base](c.minExclusive) + 1
 
    if (base != "gYear") {
       if (max === null) max = base == "gDay" ? 31 : 12
       if (min === null) min = 1
    }
    else {
       if (max === null && min === null) {max = 2020; min = 0}
       else if (max == null) max = min + 1000
       else if (min == null) min = max - 1000
    }
 
    let hyphens = {gDay: 3, gMonth: 2, gYear: 0}
    let pad = base == "gYear" ? 4 : 2
    return `${"-".repeat(hyphens[base])}{{formattedInteger(${min},${max},${pad},"")}}`
}
 
function parseComplexGType(c, base, has) {
   let aux = {
      gMonthDay: (x,offset) => {
         let day = parseInt(x.substring(5,7)), month = parseInt(x.substring(2,4))

         if (offset == -1) {
            if (day > 1) day--
            else {
               month--
               if ([1,3,5,7,8,10].includes(month)) day = 31
               else if ([4,6,9,11].includes(month)) day = 30
               else if (month == 2) day = 28
            }
         }
         else if (offset == 1) {
            if ((day == 29 && month == 2) || (day == 30 && [4,6,9,11].includes(month)) || (day == 31 && [1,3,5,7,8,10].includes(month))) {month++; day = 1}
            else day++
         }

         return {month, day}
      },
      gYearMonth: (x,offset) => {
         let year = parseInt(x.match(/^\-?\d+/))
         let month = parseInt(x.replace(/^\-?\d+\-/, "").match(/^\d+/))

         if (offset == -1) {
            if (month == 1) {year--; month = 12}
            else month--
         }
         else if (offset == 1) {
            if (month == 12) {year++; month = 1}
            else month++
         }

         return {year, month}
      }
   }

   let max = null, min = null

   if (has("maxInclusive")) max = aux[base](c.maxInclusive, 0)
   if (has("minInclusive")) min = aux[base](c.minInclusive, 0)
   if (has("maxExclusive")) max = aux[base](c.maxExclusive, -1)
   if (has("minExclusive")) min = aux[base](c.minExclusive, 1)
   
   if (max === null && min === null) {
      max = base == "gMonthDay" ? {month: 12, day: 31} : {year: 2020, month: 12}
      min = base == "gMonthDay" ? {month: 1, day: 1} : {year: 0, month: 1}
   }
   else if (max == null) max = base == "gMonthDay" ? {month: 12, day: 31} : {year: min.year + 100, month: 12}
   else if (min == null) min = base == "gMonthDay" ? {month: 1, day: 1} : {year: max.year - 100, month: 1}

   max = base == "gMonthDay" ? `"--${String(max.month).padStart(2,"0")}-${String(max.day).padStart(2,"0")}"` : `"${String(max.year).padStart(4,"0")}-${String(max.month).padStart(2,"0")}"`
   min = base == "gMonthDay" ? `"--${String(min.month).padStart(2,"0")}-${String(min.day).padStart(2,"0")}"` : `"${String(min.year).padStart(4,"0")}-${String(min.month).padStart(2,"0")}"`

   return `{{xsd_${base}(${min},${max})}}`
}
 
function parseDateTimeType(c, base, has) {
   let aux = {
      date: (str, offset) => {
         let neg = str[0] == "-"
         if (neg) str = str.substring(1)

         let date = new Date(str)
         
         if (offset != 0) {
            // se for uma date, o offset é em dias
            if (base == "date") date = new Date(parseInt(date.setDate(date.getDate() + offset)))
            // caso contrário, é em segundos
            else date = new Date(parseInt(date.getTime() + offset*1000))
         }

         date = date.toISOString().split("T")
         date[1] = date[1].slice(0,-5)

         return date.join("T") //{date, neg}
      },
      time: (t,offset) => {
         t = t.match(/^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.\d+)?/)
         t.shift()

         let lastIndex = t.length-1
         if (t[lastIndex] === undefined) t.pop()
         else t[lastIndex] = t[lastIndex].substring(1)

         t = t.map(x => parseInt(x))
         t[t.length-1] += offset
         if (t.length == 3) t.push(0)
         
         let ms = t.pop()
         return {time: t.map(x => x.toString().padStart(2,"0")).join(":"), ms}
      },
      duration: (d, offset) => {
         let parts = []
         d = d.substring(1).split("T")
         if (d.length == 1) d.push("")

         let getParts = (chars, str) => {
            for (let i = 0; i < chars.length; i++) {
               if (!str.includes(chars[i])) {
                  parts.push(0)
                  if (chars[i] == "S") parts.push(0)
               }
               else {
                  let split = str.split(chars[i])
                  str = split[1]

                  if (chars[i] == "S") {
                     let s = split[0].split(".")
                     if (s.length == 1) s.push("0")
                     if (!s[0].length) s[0] = "0"
                     s.map(x => parts.push(parseInt(x)))
                  }
                  else parts.push(parseInt(split[0]))
               }
            }
         }
         
         getParts(["Y","M","D"], d[0])
         getParts(["H","M","S"], d[1])

         if (offset == 1) parts[parts.length-1]++
         if (offset == -1) {
            for (let i = parts.length-1; i >= 0; i--) {
               if (parts[i] > 0) {parts[i]--; break}
            }
         }

         return parts
      },
      durationString: (d) => {
         let i = 0, str = "P", units = ["Y","M","D","H","M",".","S"], maxPossible = [0, 12, 30, 24, 59, 59, 999]

         for (let j = 0; j < 3; j++) {
            let next = d.shift()
            if (next != 0) str += next + units[i]
            i++
         }

         if (d.reduce((acc,cur) => acc += cur, 0) != 0) {
            str += "T"
            for (let j = 0; j < 3; j++) {
               let next = d.shift()
               if (next != 0) str += next + units[i]
               i++
            }
            
            if (!d[0]) str = str.slice(0,-1) + units[i]
            else str += d[0] + units[i]
         }

         return str
      }
   }

   aux.dateTime = aux.date
   let min = null, max = null

   // se for exclusivo, é preciso ajustar a data
   if (has("maxInclusive")) max = aux[base](c.maxInclusive, 0)
   if (has("minInclusive")) min = aux[base](c.minInclusive, 0)
   if (has("maxExclusive")) max = aux[base](c.maxExclusive, -1)
   if (has("minExclusive")) min = aux[base](c.minExclusive, 1)
    
   if (["date","dateTime"].includes(base)) {
      if (max === null && min === null) min = "1950-01-01T00:00:00"
      else if (min === null) {
         let maxDate = max.split("T")[0].split("-")
         let year = parseInt(maxDate[0])
         min = `${year > 1000 ? (year-1000).toString().padStart(4,"0") : "0000"}-${maxDate[1]}-${maxDate[0]}T00:00:00`
      }

      if (base == "date") {
         min = min.split("T")[0]
         if (max !== null) max = max.split("T")[0]
      }

      return `{{xsd_${base}("${min}"${max !== null ? `,"${max}"` : ""})}}`
   }
 
   if (base == "time") {
      if (max === null) max = {time: "23:59:59", ms: 999}
      if (min === null) min = {time: "00:00:00", ms: 0}

      let str = `{{time("hh:mm:ss", 24, false, "${min.time}", "${max.time}")}}`
      if (max.ms > 0 || min.ms > 0) str += `.{{integer(${min.ms}, ${max.ms})}}`
      return str
   }

   if (base == "duration") {
      if (max === null && min == null) {max = [1,0,0,0,0,0,0]; min = [0,0,0,0,0,0,0]}
      else if (max === null) {max = min; max[0] += 1}
      else if (min === null) {
         if (max[0] > 0) {min = max; min[0] -= 1}
         else min = [0,0,0,0,0,0,0]
      }

      return `{{xsd_duration("${aux.durationString(min)}","${aux.durationString(max)}")}}`
   }
}
 
function parseLanguage(c, has) {
   if ("pattern" in c && c.pattern != "([a-zA-Z]{2}|[iI]-[a-zA-Z]+|[xX]-[a-zA-Z]{1,8})(-[a-zA-Z]{1,8})*") return `{{pattern("${content.pattern}")}}`
   let max = null, min = null, len = null

   if (has("length") && (c.length == 2 || c.length == 5)) len = c.length
   else {
      if (has("maxLength")) max = c.maxLength
      if (has("minLength")) min = c.minLength
      
      if (max !== null && min !== null) {
         if (max >= 2 && min <= 2 && max < 5) len = 2
         if (max >= 5 && min <= 5 && min > 2) len = 5
      }
      else if (max !== null && max >= 2 && max < 5) len = 5
      else if (min !== null && min <= 5 && min > 2) len = 2
   }
 
   return `{{language(${len !== null ? len : ""})}}`
}

function parseRestriction(content, base) {
   // verificar se a faceta em questão existe no conteúdo
   let has = facet => facet in content
   
   if (has("enumeration")) return `{{random("${content.enumeration.join('","')}")}}`
   if ((typeof base != "string" || !base.includes("ID") && base != "language") && has("pattern")) return `{{pattern("${content.pattern}")}}`

   switch (base) {
      case "anyURI": return "http://www.w3.org/2001/XMLSchema"
      case "boolean": return "{{boolean()}}"
      case "language": return parseLanguage(content, has)
      case "IDREF": return "{DFXS_IDREF}"
      case "ID": return "{DFXS_ID}"

      case "base64Binary": case "ENTITY": case "hexBinary": case "Name": case "NCName": case "NMTOKEN":
      case "normalizedString": case "NOTATION": case "QName": case "string": case "token":
         return parseStringType(content, base, has)

      case "byte": case "decimal": case "double": case "float": case "int": case "integer": case "long": case "negativeInteger": case "nonNegativeInteger":
      case "nonPositiveInteger": case "positiveInteger": case "short": case "unsignedByte": case "unsignedInt": case "unsignedLong": case "unsignedShort":
         return parseNumberType(content, base, has)

      case "date": case "dateTime": case "duration": case "time":
         return parseDateTimeType(content, base, has)

      case "gDay": case "gMonth": case "gYear":
         return parseSimpleGType(content, base, has)

      case "gMonthDay": case "gYearMonth":
         return parseComplexGType(content, base, has)
   }
}

function parseList(st, depth) {
   st.content.map((x,i) => st.content[i].content = st.content[i].content.reduce((a,c) => {a[c.element] = c.attrs.value; return a}, {}))

   let list = st.list.reduce((a,c) => {a[c.element] = c.attrs.value; return a}, {})
   if ("enumeration" in list) return `'{{random("${list.enumeration.join('","')}")}}'`

   let str = ""
   let max = null, min = null

   if ("minLength" in list) min = list.minLength
   if ("maxLength" in list) max = list.maxLength
   if ("length" in list) {max = list.length; min = max}

   if (max === null && min === null) {max = 5; min = 2}
   else if (max === null) max = min + 5
   else if (min === null) min = min-5 > 0 ? min-5 : 0

   if (st.content.length == 1) {
      let elem = parseRestriction(st.content[0].content, st.content[0].built_in_base)

      str = `gen => {\n${indent(depth)}let elems = []\n`
      str += `${indent(depth)}for (let i = 0; i < Math.floor(Math.random()*(${max}-${min}))+${min}; i++) elems.push(${convertDSLToFunction(elem)})\n`
      str += `${indent(depth--)}return elems.join(" ")\n${indent(depth)}}`
      return str
   }
   else {
      let types = st.content.map(x => parseRestriction(x.content, x.built_in_base))
      types.map((t,i) => types[i] = convertDSLToFunction(t))

      str = `gen => {\n${indent(depth)}let elems = []\n`
      str += `${indent(depth++)}for (let i = 0; i < Math.floor(Math.random()*(${max}-${min}))+${min}; i++) {\n`
      str += `${indent(depth)}let values = [${types.join(", ")}]\n`
      str += `${indent(depth)}let next = values[Math.floor(Math.random()*(values.length))]\n`
      str += `${indent(depth--)}elems.push(next)\n${indent(depth)}}\n`
      return str + `${indent(depth--)}return elems.join(" ")\n${indent(depth)}}`
   }
}

function parseComplexUnion(types, depth) {
   let functions = []
   types.map((x,i) => {
      if (/^gen =>/.test(x)) {
         types[i] = x.replace(/^gen/, `let f${i} = ()`).replace(/\n(\t*)/g, (m) => m+"\t").replace(/\t+}$/, `${indent(depth+1)}}`)
         functions.push(i)
      }
      else types[i] = convertDSLToFunction(x.slice(1,-1)) // tirar os apóstrofes da interpolação
   })

   let str = `gen => {\n`
   types.filter((x,i) => {if (functions.includes(i)) return x}).map(x => str += `${indent(depth+1)}${x}\n`)
   str += `${indent(depth+1)}let options = [${types.map((x,i) => !functions.includes(i) ? x : `f${i}()`).join(", ")}]\n`
   str += `${indent(depth+1)}return options[Math.floor(Math.random()*options.length)]\n${indent(depth)}}`
   return str
}

function parseSimpleType(st, depth) {
   let str
   
   // derivação por lista
   if ("list" in st) str = parseList(st, depth+1)

   // derivação por união
   else if ("union" in st) {
      let types = st.union.map(x => parseSimpleType(x, depth))

      if (!st.union.some(x => "list" in x)) str = `gen => { return gen.random(${types.map(x => convertDSLToFunction(x.slice(1,-1))).join(", ")}) }`
      else str = parseComplexUnion(types, depth)
   }

   // derivação por restrição
   else {
      let content = st.content.reduce((a,c) => {a[c.element] = c.attrs.value; return a}, {})
      let parsed = parseRestriction(content, st.built_in_base)
      str = "'" + parsed + "'"
   }
   
   return str
}


module.exports = { parseSimpleType }