const clubsJS = require('../datasets/soccer_clubs.js');
const clubs = clubsJS.soccer_clubs

const _ = require('lodash')

const soccer_clubsAPI = {
    get() { return clubs },

    soccer_club(lang, i, sample) {
        let clubArray = clubs.map(x => x.clubs).flat()
        if (sample > -1) return _.sampleSize(clubArray, sample)
        return clubArray[Math.floor(Math.random() * clubArray.length)]
    },

    soccer_club_from(lang, i, sample, country) {
        if (Array.isArray(country)) country = country[i]
        country = country.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
        
        for (let c of clubs) {
            if (c.country.includes(country)) {
                if (sample > -1) return _.sampleSize(c.clubs, sample)
                return c.clubs[Math.floor(Math.random() * c.clubs.length)]
            }
        }
        return false
    }
}

module.exports =  soccer_clubsAPI