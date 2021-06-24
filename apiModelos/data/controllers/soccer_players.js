const playersJS = require('../datasets/soccer_players.js');
const players = playersJS.soccer_players

const _ = require('lodash')

const soccer_playerAPI = {
    get() { return players },
    soccer_player(lang, i, sample) {
        if (sample > -1) return _.sampleSize(players, sample)
        return players[Math.floor(Math.random() * players.length)]
    }
}

module.exports =  soccer_playerAPI