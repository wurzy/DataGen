const pt_entities = require('../datasets/pt_entities.js');
const entities = pt_entities.pt_entities

const _ = require('lodash')

const pt_entitiesAPI = {
    get() { return entities },

    pt_entity(lang, i, sample) {
        if (sample > -1) return _.sampleSize(entities, sample).map(x => {return {abbr: x.sigla, name: x.designacao}})
        var entity = entities[Math.floor(Math.random() * entities.length)]
        return {
            abbr: entity.sigla,
            name: entity.designacao
        }
    },
    
    pt_entity_abbr(lang, i, sample) {
        if (sample > -1) return _.sampleSize(entities, sample).map(x => x.sigla)
        return entities[Math.floor(Math.random() * entities.length)].sigla
    },

    pt_entity_name(lang, i, sample) {
        if (sample > -1) return _.sampleSize(entities, sample).map(x => x.designacao)
        return entities[Math.floor(Math.random() * entities.length)].designacao
    }
}

module.exports =  pt_entitiesAPI