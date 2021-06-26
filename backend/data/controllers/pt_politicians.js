const politiciansJS = require('../datasets/pt_politicians.js');
const politicians = politiciansJS.politicians

const _ = require('lodash')

const pt_politicianAPI = {
    get() { return politicians },
    pt_politician(lang, i, sample) {
        if (sample > -1) return _.sampleSize(politicians, sample)
        return politicians[Math.floor(Math.random() * politicians.length)]
    }
}

module.exports =  pt_politicianAPI