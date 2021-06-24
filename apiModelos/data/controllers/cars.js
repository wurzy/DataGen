const carsJS = require('../datasets/cars.js');
const cars = carsJS.cars

const _ = require('lodash')

const carsAPI = {
    get() { return cars },
    car_brand(lang, i, sample) {
        if (sample > -1) return _.sampleSize(cars, sample)
        return cars[Math.floor(Math.random() * cars.length)]
    }
}

module.exports =  carsAPI