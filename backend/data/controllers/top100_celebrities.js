const top100JS = require('../datasets/top100_celebrities.js');
const top100 = top100JS.top100_celebrities

const _ = require('lodash')

const top100_celebritiesAPI = {
    get() { return top100 },
    top100_celebrity(lang, i, sample) {
        if (sample > -1) return _.sampleSize(top100, sample)
        return top100[Math.floor(Math.random() * top100.length)]
    }
}

module.exports =  top100_celebritiesAPI