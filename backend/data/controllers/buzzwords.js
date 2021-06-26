const buzzwordsJS = require('../datasets/buzzwords.js');
const buzzwords = buzzwordsJS.buzzwords

const _ = require('lodash')

const buzzwordsAPI = {
    get() { return buzzwords },
    buzzword(lang, i, sample) {
        if (sample > -1) return _.sampleSize(buzzwords[lang], sample)
        return buzzwords[lang][Math.floor(Math.random() * buzzwords[lang].length)]
    }
}

module.exports =  buzzwordsAPI