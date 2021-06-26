const weekdaysJS = require('../datasets/weekdays.js');
const weekdays = weekdaysJS.weekdays

const _ = require('lodash')

const weekdaysAPI = {
    get() { return weekdays },
    weekday(lang, i, sample) {
        if (sample > -1) return _.sampleSize(weekdays[lang], sample)
        return weekdays[lang][Math.floor(Math.random() * weekdays[lang].length)]
    }
}

module.exports =  weekdaysAPI