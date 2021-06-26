const public_figuresJS = require('../datasets/pt_public_figures.js');
const public_figures = public_figuresJS.public_figures

const _ = require('lodash')

const pt_public_figuresAPI = {
    get() { return public_figures },
    pt_public_figure(lang, i, sample) {
        if (sample > -1) return _.sampleSize(public_figures, sample)
        return public_figures[Math.floor(Math.random() * public_figures.length)]
    }
}

module.exports =  pt_public_figuresAPI