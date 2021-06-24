const nationalitiesJS = require('../datasets/nationalities.js');
const nationalities = nationalitiesJS.nationalities

const _ = require('lodash')

const nationalitiesAPI = {
    get() { return nationalities },
    nationality(lang, i, sample) {
        if (sample > -1) return _.sampleSize(nationalities[lang], sample)
        return nationalities[lang][Math.floor(Math.random() * nationalities[lang].length)]
    }
}

module.exports =  nationalitiesAPI