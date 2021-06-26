const animalsJS = require('../datasets/animals.js');
const animals = animalsJS.animals

const _ = require('lodash')

const animalsAPI = {
    get() { return animals },
    animal(lang, i, sample) {
        if (sample > -1) return _.sampleSize(animals, sample)
        return animals[Math.floor(Math.random() * animals.length)]
    }
}

module.exports =  animalsAPI