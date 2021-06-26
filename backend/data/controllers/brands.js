const brandsJS = require('../datasets/brands.js');
const brands = brandsJS.brands

const _ = require('lodash')

const brandsAPI = {
    get() { return brands },
    brand(lang, i, sample) {
        if (sample > -1) return _.sampleSize(brands, sample)
        return brands[Math.floor(Math.random() * brands.length)]
    }
}

module.exports =  brandsAPI