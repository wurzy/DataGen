const centersJS = require('../datasets/cultural_centers.js');
const centers = centersJS.cultural_centers

const _ = require('lodash')

const cultural_centersAPI = {
    get() { return centers },
    cultural_center(lang, i, sample) {
        if (sample > -1) return _.sampleSize(centers[lang], sample)
        return centers[lang][Math.floor(Math.random() * centers[lang].length)]
    }
}

module.exports =  cultural_centersAPI