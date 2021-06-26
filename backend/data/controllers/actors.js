const actorsJS = require('../datasets/actors.js');
const actors = actorsJS.actors

const _ = require('lodash')

const actorsAPI = {
    get() { return actors },
    actor(lang, i, sample) {
        if (sample > -1) return _.sampleSize(actors, sample)
        return actors[Math.floor(Math.random() * actors.length)]
    }
}

module.exports =  actorsAPI