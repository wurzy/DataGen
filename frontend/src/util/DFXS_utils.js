const genAPI = require('./moustaches')

const local = {
    string: args => string(...args),
    hexBinary: args => hexBinary(...args),
    complexGType: args => complexGType(...args),
    dateTime: args => dateTime(...args),
    duration: args => duration(...args)
}

let randomize = len => Math.floor(Math.random() * len)
let rand = (max,min) => Math.floor(Math.random() * ((max+1) - min) + min)

function string(base, length) {
    length = parseInt(length)

    //[".",":","-","_"]
    let alphabet = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","z","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
    let alphanumerical = [...alphabet,"0","1","2","3","4","5","6","7","8","9"]
 
    let space = ["normalizedString","string","token"].includes(base)
    if (base == "base64Binary") alphanumerical.push("+").push("/")
 
    let str = ""
    for (let i = 0; i < length; i++) {
        let arr = (!i && ["Name","NCName","ENTITY","ID","IDREF","NOTATION","QName"].includes(base)) ? alphabet : alphanumerical
        if (space && i>0 && i != length-1) arr.push(" ")
        str += arr[randomize(arr.length)]
    }
    return str
}

function hexBinary(length) {
    length = parseInt(length)

    let hexChars = [...Array(60).keys()].map(i => i + 20)
    hexChars = hexChars.concat(["2","3","4","5","6","7"].map(x => ["A","B","C","D","E","F"].map(y => x+y)).flat())
    hexChars.pop()

    let str = ""
    for (let i = 0; i < length; i++) str += hexChars[randomize(hexChars.length)]
    return str
}

function complexGType(base, max, min, list) {
    max = JSON.parse(max)
    min = JSON.parse(min)
    list = JSON.parse(list)

    let str = ""
    let left = base == "gMonthDay" ? "month" : "year"
    let right = base == "gMonthDay" ? "day" : "month"
    
    let right_lower_bound = {
       month: x => 12,
       day: x => {
          if ([1,3,5,7,8,10,12].includes(x)) return 31
          if ([4,6,9,11].includes(x)) return 30
          return 29
       }
    }

    for (let i = 0; i < rand(list.max, list.min); i++) {
       let right_val, left_val = rand(max[left], min[left])
       
       if (left_val == max[left]) right_val = rand(max[right], 1)
       else if (left_val == min[left]) right_val = rand(min[right], right_lower_bound[right](left_val))
       else right_val = rand(1, right_lower_bound[right](left_val))

       let hyphens = {gMonthDay: 2, gYearMonth: 0}
       let pad = base == "gMonthDay" ? [2,2] : [4,2]

       str += "-".repeat(hyphens[base]) + left_val.toString().padStart(pad[0],"0") + "-" + right_val.toString().padStart(pad[1],"0") + " "
    }

    return str.slice(0,-1)
}

function dateTime(base, max, min, list) {
    max = JSON.parse(max)
    min = JSON.parse(min)
    list = JSON.parse(list)

    let str = ""

    for (let i = 0; i < rand(list.max,list.min); i++) {
        let time, date = max !== null ? genAPI.date(min.date[0], max.date[0], "YYYY-MM-DD", 0) : genAPI.date(min.date[0], null, "YYYY-MM-DD", 0)
          
        if (max !== null) max.date[0] = max.date[0].split("/").reverse().join("-")
        min.date[0] = min.date[0].split("/").reverse().join("-")
        
        if (base == "dateTime") {             
            if (max !== null && date == max.date[0]) time = genAPI.time("hh:mm:ss", 24, false, {start: max.date[1], end: "23:59:59"}, 0)
            else if (date == min.date[0]) time = genAPI.time("hh:mm:ss", 24, false, {start: "00:00:00", end: min.date[1]}, 0)
            else time = genAPI.time("hh:mm:ss", 24, false, null, 0)
        }
        if ((max !== null && date > max.date[0]) || date < min.date[0]) date = "-" + date
        str += date + (base == "dateTime" ? ("T" + time) : "") + " "
    }
    
    return str.slice(0,-1)
}

function duration(max, min, list) {
    max = JSON.parse(max)
    min = JSON.parse(min)
    list = JSON.parse(list)

    let str = ""

    for (let i = 0; i < rand(list.max,list.min); i++) {
        let duration = "P", units = ["Y","M","D","H","M",".","S"], maxPossible = [0, 12, 30, 24, 59, 59, 999]
        let fstEq = false, random
        for (let i = 0; i < max.length; i++) {
            if (!fstEq) {
                if (max[i] == min[i]) {
                    if (max[i] != 0) duration += max[i] + units[i]
                    else if (units[i] == ".") duration += units[i]
                }
                else {
                    fstEq = true
                    random = {new: rand(max[i], min[i]), inf: min[i], sup: max[i]}
                    let sum = arr => arr.reduce((c,a) => c+a, 0)
                    if (max[0] == 1 && !min[0] && !sum(max.slice(1)) && !sum(min.slice(1))) random.new = 0
                    if (random.new != 0) duration += random.new + units[i]
                }
            }
            else {
                let next_part
                if (random.new == random.inf) next_part = rand(maxPossible[i], min[i])
                else if (random.new == random.sup) next_part = rand(max[i], 0)
                else next_part = rand(maxPossible[i], 0)
                if (next_part > 0) duration += next_part + units[i]
            }
            if (i == 2) duration += "T"
        }
        str += duration + " "
    }

    return str.slice(0,-1)
}

function list(elems) {
    let str = ""

    for (let i = 0; i < elems.length; i++) {
        if (typeof elems[i] === 'object' && elems[i] != null) {
            let key = Object.keys(elems[i])[0]
            str += local[key.replace(/^DFS_UTILS__/, "")](elems[i][key].split(";")) + " "
        }
        else str += elems[i] + " "
    }

    return str.slice(0,-1)
}

module.exports = {
    string,
    hexBinary,
    complexGType,
    dateTime,
    duration,
    list
}