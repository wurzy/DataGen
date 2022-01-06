const genAPI = require('./moustaches')

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
    let str = ""

    for (let i = 0; i < rand(list.max,list.min); i++) {
        let time, date = max !== null ? genAPI.date(min.date[0], max.date[0], "YYYY-MM-DD") : genAPI.date(min.date[0], "YYYY-MM-DD")
        
        if (max !== null) max.date[0] = max.date[0].split("/").reverse().join("-")
        min.date[0] = min.date[0].split("/").reverse().join("-")
        
        if (base == "dateTime") {             
            if (max !== null && date == max.date[0]) time = genAPI.time("hh:mm:ss", 24, false, max.date[1], "23:59:59")
            else if (date == min.date[0]) time = genAPI.time("hh:mm:ss", 24, false, "00:00:00", min.date[1])
            else time = genAPI.time("hh:mm:ss", 24, false)
        }
        if ((max !== null && date > max.date[0]) || date < min.date[0]) date = "-" + date
        str += date + (base == "dateTime" ? ("T" + time) : "") + " "
    }
    
    return str.slice(0,-1)
}

module.exports = {
    string,
    hexBinary,
    complexGType
}