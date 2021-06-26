const religionsJS = require('../datasets/religions.js');
const religions = religionsJS.religions

const _ = require('lodash')

const religionsAPI = {
    get() { return religions },
    religion(lang, i, sample) {
        if (sample > -1) return _.sampleSize(religions[lang], sample)
        return religions[lang][Math.floor(Math.random() * religions[lang].length)]
    }
}

module.exports =  religionsAPI