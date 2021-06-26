const monthsJS = require('../datasets/months.js');
const months = monthsJS.months

const _ = require('lodash')

const monthsAPI = {
    get() { return months },
    month(lang, i, sample) {
        if (sample > -1) return _.sampleSize(months[lang], sample)
        return months[lang][Math.floor(Math.random() * months[lang].length)]
    }
}

module.exports =  monthsAPI