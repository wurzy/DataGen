const sportsJS = require('../datasets/sports.js');
const sports = sportsJS.sports

const _ = require('lodash')

const sportsAPI = {
    get() { return sports },
    sport(lang, i, sample) {
        if (sample > -1) return _.sampleSize(sports[lang], sample)
        return sports[lang][Math.floor(Math.random() * sports[lang].length)]
    }
}

module.exports =  sportsAPI