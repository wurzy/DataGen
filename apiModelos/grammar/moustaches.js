const loremIpsum = require("lorem-ipsum").loremIpsum;
const moment = require('moment')
const _ = require('lodash')
const getRandomValues = require('get-random-values');

function hex(x) { return Math.floor(x).toString(16) }

function getDecimalsCount(min, max) {
    var decimals = 3; //3 caracteres decimais por predefinição
    const maxStr = String(max);
    const minStr = String(min);

    if (minStr.includes('.')) decimals = minStr.split('.')[1].length;
    if (maxStr.includes('.')) {
        var maxDecimals = maxStr.split('.')[1].length;
        if (decimals < maxDecimals) decimals = maxDecimals;
    }

    return decimals
}

function formatNumber(num) {
    var x = num.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace( rgx, '$1' + ',' + '$2' );
    }
    return x1 + x2;
}

function objectId(i) {
    return hex(Date.now() / 1000) + ' '.repeat(16).replace(/./g, () => hex(Math.random() * 16))
}

function guid(i) {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))
}

function boolean(i) { return Math.random() < 0.5 }

function getIndexes(num, struct_types, array_indexes) {
  if (struct_types[struct_types.length-1] == "repeat") return [...Array(num).keys()]
  else if (struct_types[struct_types.length-1] == "array") return Array(num).fill(array_indexes[array_indexes.length-1])
  else {
    var index = struct_types.length-1
    while (index >= 0 && struct_types[index] == "object") index--
    if (index >= 0) {
      if (struct_types[index] == "repeat") return [...Array(num).keys()]
      else return Array(num).fill(array_indexes[array_indexes.length-1])
    }
    else return false //não está dentro de um array
  }
}

function index(offset, queue_last, struct_types, array_indexes, i) {
    var arrays = []
    if (offset == null) offset = 0

    if (Array.isArray(queue_last.value)) queue_last.value.forEach(n => arrays.push(getIndexes(n, struct_types, array_indexes)))
    else arrays = Array(queue_last.total/queue_last.value).fill(getIndexes(queue_last.value, struct_types, array_indexes))

    if (arrays[0] == false) return false
    return arrays.flat().map(k => k + offset)[i]
}

function padding(rand, pad) {
    var negative = false, decimal = false

    if (rand[0] == '-') {negative = true; rand = rand.substr(1)}
    if (rand.includes('.')) {
        let split = rand.split('.')
        decimal = split[1]
        rand = split[0]
    }

    while (rand.length < pad) rand = "0" + rand

    if (negative) rand = '-' + rand
    if (decimal != false) rand += '.' + decimal

    return rand
}

function decimalPadding(rand, pad) {
    var len = rand.substring(rand.indexOf('.')).length
    for (let i = len; i < pad; i++) rand += '0'

    return rand
}

function integer(min, max, i) {
    min = Array.isArray(min) ? min[i] : min
    max = Array.isArray(max) ? max[i] : max

    return Math.floor(Math.random() * ((max+1) - min) + min)
}

function formattedInteger(min, max, pad, unit, i) {
    min = Array.isArray(min) ? min[i] : min
    max = Array.isArray(max) ? max[i] : max
    pad = Array.isArray(pad) ? pad[i] : pad

    var rand = Math.floor(Math.random() * ((max+1) - min) + min).toString()
    return padding(rand,pad) + unit
}

function float(min, max, decimals, i) {
    min = Array.isArray(min) ? min[i] : min
    max = Array.isArray(max) ? max[i] : max

    decimals = Array.isArray(decimals) ? decimals[i] : decimals
    if (decimals == null) decimals = getDecimalsCount(min,max)

    var random = min + (max - min) * Math.random()
    return Math.round((random + Number.EPSILON) * Math.pow(10,decimals)) / Math.pow(10,decimals)
}

function formattedFloat(min, max, decimals, pad, format, i) {
    min = Array.isArray(min) ? min[i] : min
    max = Array.isArray(max) ? max[i] : max
    pad = Array.isArray(pad) ? pad[i] : pad

    decimals = Array.isArray(decimals) ? decimals[i] : decimals
    if (decimals == null) decimals = getDecimalsCount(min,max)

    var random = min + (max - min) * Math.random()
    var rounded = Math.round((random + Number.EPSILON) * Math.pow(10,decimals)) / Math.pow(10,decimals)

    rounded = decimalPadding(rounded.toString(), decimals)
    rounded = padding(rounded, pad)
  
    var split = formatNumber(rounded).split('.')
    rounded = split[0].replace(/,/g, format[1])
  
    if (split[1] != null) rounded += format[3] + split[1] 
    if (format.length > 6) rounded += format.substring(6)

    return rounded
}

function position(lat, long, i) {
    lat = (lat != null && Array.isArray(lat[0])) ? lat[i] : lat
    long = (long != null && Array.isArray(long[0])) ? long[i] : long

    if (!lat) return "(" + float(-90,90,5,null) + ", " + float(-180,180,5,null) + ")"
    else {
        if (lat[0] > lat[1]) {var latmax = lat[0]; lat[0] = lat[1]; lat[1] = latmax}
        if (long[0] > long[1]) {var longmax = long[0]; long[0] = long[1]; long[1] = longmax}

        return "(" + float(lat[0], lat[1], 5, null) + ", " + float(long[0], long[1], 5, null) + ")"
    }
}

function pt_phone_number(extension, i) {
    var number = "9" + random([1,2,3,6])
    while (number.length < 11) {
        if (number.length == 3 || number.length == 7) number += " "
        else number += (Math.floor(Math.random() * 9) + 1)
    }
    return extension ? ("+351 " + number) : number
}

function newDate(str) {
    var split = str.split("/")
    return new Date(parseInt(split[2]), parseInt(split[1])-1, parseInt(split[0]))
}

function date(start, end, format, i) {
    start = Array.isArray(start) ? start[i] : start
    end = Array.isArray(end) ? end[i] : end
    
    start = newDate(start)
    end = !end ? new Date() : newDate(end)

    var random = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    if (format != null) random = moment(random).format(format.replace(/A/g, "Y"))

    return random
}

function lorem(count, units, i) {
    count = Array.isArray(count) ? count[i] : count
    return loremIpsum({ count, units })
}

function random(values, i, sample) {
    values = values.map(x => Array.isArray(x) ? x[i] : x)
    if (sample > -1) return _.sampleSize(values, sample)
    return values[Math.floor(Math.random() * values.length)]
}

function range(init, end, step, i) {
    init = Array.isArray(init) ? init[i] : init

    if (end == null) {
      end = init; init = 0
      step = init < end ? 1 : -1
    }
    else {
        end = Array.isArray(end) ? end[i] : end
        if (step == null) step = init < end ? 1 : -1
        else step = Array.isArray(step) ? step[i] : step
    }

    var range = []
    for (let i = init; (init < end) ? i < end : i > end; i += step) range.push(i)
    return range
}

module.exports = {
    objectId,
    guid,
    boolean,
    index,
    integer,
    formattedInteger,
    float,
    formattedFloat,
    position,
    pt_phone_number,
    date,
    lorem,
    random,
    range
}