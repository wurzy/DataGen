const continentsJS = require('../datasets/continents.js');
const continents = continentsJS.continents

const _ = require('lodash')

const continentsAPI = {
    get() { return continents },
    continent(lang, i, sample) {
        if (sample > -1) return _.sampleSize(continents[lang], sample)
        return continents[lang][Math.floor(Math.random() * continents[lang].length)]
    }
}

module.exports =  continentsAPI