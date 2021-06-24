const entitiesJS = require('../datasets/gov_entities.js');
const entities = entitiesJS.gov_entities

const _ = require('lodash')

const govEntitiesAPI = {
    get() { return entities },
    gov_entity(lang, i, sample) {
        if (sample > -1) return _.sampleSize(entities, sample)
        return entities[Math.floor(Math.random() * entities.length)]
    }
}

module.exports =  govEntitiesAPI