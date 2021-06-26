const citiesJS = require('../datasets/cities.js');
const cities = citiesJS.cities

const _ = require('lodash')

function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

const citiesAPI = {
    get() { return cities },

    city(lang, i, sample) {
        if (sample > -1) return _.sampleSize(cities, sample).map(x => x.city)
        return cities[Math.floor(Math.random() * cities.length)].city
    },

    city_from(lang, i, sample, country) {
        if (Array.isArray(country)) country = country[i]
        country = normalize(country)
        
        let all = cities.filter(x => normalize(x.country) == country)
        return all[Math.floor(Math.random() * all.length)].city
    },

    city_coordinates(lang, i, sample, city, country) {
        if (Array.isArray(city)) city = city[i]
        if (Array.isArray(country)) country = country[i]

        city = normalize(city)
        country = normalize(country)

        var countryCities = cities.filter(x => normalize(x.country) == country)
        var normCities = countryCities.map(x => normalize(x.city))

        if (normCities.includes(city)) {
            var c = countryCities[normCities.indexOf(city)]
            return {
                latitude: parseFloat(c.lat),
                longitude: parseFloat(c.lng)
            }
        }
    },

    city_population(lang, i, sample, city, country) {
        if (Array.isArray(city)) city = city[i]
        if (Array.isArray(country)) country = country[i]

        city = normalize(city)
        country = normalize(country)

        var countryCities = cities.filter(x => normalize(x.country) == country)
        var normCities = countryCities.map(x => normalize(x.city))

        if (normCities.includes(city)) return countryCities[normCities.indexOf(city)].population
    }
}

module.exports =  citiesAPI