const namesJS = require('../datasets/names.js');
const names = namesJS.names

const _ = require('lodash')

const namesAPI = {
    get() { return names },

    firstName(lang, i, sample) {
        if (sample > -1) return _.sampleSize(names[lang].firstnames, sample)
        return names[lang].firstnames[Math.floor(Math.random() * names[lang].firstnames.length)]
    },

    surname(lang, i, sample) {
        if (sample > -1) return _.sampleSize(names[lang].surnames, sample)
        return names[lang].surnames[Math.floor(Math.random() * names[lang].surnames.length)]
    },

    fullName(lang, i, sample) {
        if (sample > -1) {
            let fstnames = _.sampleSize(names[lang].firstnames, sample)
            let surnames = _.sampleSize(names[lang].surnames, sample)
            return fstnames.map((d, i) => d + " " + surnames[i])
        }
        return `${this.firstName(lang, i, -1)} ${this.surname(lang, i, -1)}`
    }
}

module.exports =  namesAPI