const writersJS = require('../datasets/writers.js');
const writers = writersJS.writers

const _ = require('lodash')

const writersAPI = {
    get() { return writers },
    writer(lang, i, sample) {
        if (sample > -1) return _.sampleSize(writers, sample)
        return writers[Math.floor(Math.random() * writers.length)]
    }
}

module.exports =  writersAPI