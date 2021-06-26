const jobsJS = require('../datasets/jobs.js');
const jobs = jobsJS.jobs

const _ = require('lodash')

const jobsAPI = {
    get() { return jobs },
    job(lang, i, sample) {
        if (sample > -1) return _.sampleSize(jobs[lang], sample)
        return jobs[lang][Math.floor(Math.random() * jobs[lang].length)]
    }
}

module.exports =  jobsAPI