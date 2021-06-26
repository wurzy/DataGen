const countriesJS = require('../datasets/countries.js');
const countries = countriesJS.countries

const _ = require('lodash')

const countriesAPI = {
    get() { return countries },
    country(lang, i, sample) {
        if (sample > -1) return _.sampleSize(countries[lang], sample)
        return countries[lang][Math.floor(Math.random() * countries[lang].length)]
    }
}

module.exports =  countriesAPI