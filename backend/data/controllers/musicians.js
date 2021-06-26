const musiciansJS = require('../datasets/musicians.js');
const musicians = musiciansJS.musicians

const _ = require('lodash')

const musiciansAPI = {
    get() { return musicians },
    musician(lang, i, sample) {
        if (sample > -1) return _.sampleSize(musicians, sample)
        return musicians[Math.floor(Math.random() * musicians.length)]
    }
}

module.exports =  musiciansAPI