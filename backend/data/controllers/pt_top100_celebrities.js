const top100JS = require('../datasets/pt_top100_celebrities.js');
const top100 = top100JS.pt_top100_celebrities

const _ = require('lodash')

const pt_top100_celebritiesAPI = {
    get() { return top100 },
    pt_top100_celebrity(lang, i, sample) {
        if (sample > -1) return _.sampleSize(top100, sample)
        return top100[Math.floor(Math.random() * top100.length)]
    }
}

module.exports =  pt_top100_celebritiesAPI