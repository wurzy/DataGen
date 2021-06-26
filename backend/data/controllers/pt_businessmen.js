const businessmenJS = require('../datasets/pt_businessmen.js');
const businessmen = businessmenJS.pt_businessmen

const _ = require('lodash')

const businessmenAPI = {
    get() { return businessmen },
    pt_businessman(lang, i, sample) {
        if (sample > -1) return _.sampleSize(businessmen, sample)
        return businessmen[Math.floor(Math.random() * businessmen.length)]
    }
}

module.exports =  businessmenAPI