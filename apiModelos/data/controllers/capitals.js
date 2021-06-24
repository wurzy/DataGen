const capitalsJS = require('../datasets/capitals.js');
const capitals = capitalsJS.capitals

const _ = require('lodash')

const capitalsAPI = {
    get() { return capitals },
    capital(lang, i, sample) {
        if (sample > -1) return _.sampleSize(capitals, sample)
        return capitals[Math.floor(Math.random() * capitals.length)]
    }
}

module.exports =  capitalsAPI