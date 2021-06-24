const hackersJS = require('../datasets/hackers.js');
const hackers = hackersJS.hackers

const _ = require('lodash')

const hackersAPI = {
    get() { return hackers },
    hacker(lang, i, sample) {
        if (sample > -1) return _.sampleSize(hackers, sample)
        return hackers[Math.floor(Math.random() * hackers.length)]
    }
}

module.exports =  hackersAPI