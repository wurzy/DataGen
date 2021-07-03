const districtsJS = require('../datasets/pt_districts.js');
const districts = districtsJS.districts

const _ = require('lodash')

function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

const districtsAPI = {
    get() { return districts },

    pt_district(lang, i, sample) {
        if (sample > -1) return _.sampleSize(districts, sample).map(x => x.district)
        return districts[Math.floor(Math.random() * districts.length)].district
    },

    pt_districtOfCounty(lang, i, sample, county) {
        if (Array.isArray(county)) county = (sample > -1) ? county.map(x => normalize(x)) : normalize(county[i])
        else county = normalize(county)
        
        if (Array.isArray(county)) return county.map(c => {
            for (let dist of districts) {
                let counties = dist.counties.map(x => normalize(x.county))
                if (counties.includes(c)) return dist.district
            }
            return false
        })
        else {
            let district = false
            for (let dist of districts) {
                let counties = dist.counties.map(x => normalize(x.county))
                if (counties.includes(county)) district = dist.district
            }

            return (sample > -1) ? Array(sample).fill(district) : district
        }
    },

    pt_districtOfParish(lang, i, sample, parish) {
        if (Array.isArray(parish)) parish = (sample > -1) ? parish.map(x => normalize(x)) : normalize(parish[i])
        else parish = normalize(parish)
        
        if (Array.isArray(parish)) return parish.map(c => {
            for (let dist of districts) {
                let parishes = dist.counties.map(x => x.parishes).flat().map(x => normalize(x))
                if (parishes.includes(c)) return dist.district
            }
            return false
        })
        else {
            let district = false
            for (let dist of districts) {
                let parishes = dist.counties.map(x => x.parishes).flat().map(x => normalize(x))
                if (parishes.includes(parish)) district = dist.district
            }

            return (sample > -1) ? Array(sample).fill(district) : district
        }
    },

    pt_districtOfCity(lang, i, sample, city) {
        if (Array.isArray(city)) city = (sample > -1) ? city.map(x => normalize(x)) : normalize(city[i])
        else city = normalize(city)
        
        if (Array.isArray(city)) return city.map(c => {
            for (let dist of districts) {
                let cities = dist.cities.map(x => normalize(x.city))
                if (cities.includes(c)) return dist.district
            }
            return false
        })
        else {
            let district = false
            for (let dist of districts) {
                let cities = dist.cities.map(x => normalize(x.city))
                if (cities.includes(city)) district = dist.district
            }

            return (sample > -1) ? Array(sample).fill(district) : district
        }
    },

    pt_county(lang, i, sample) {
        const counties = districts.map(x => x.counties.map(x => x.county)).flat()
        if (sample > -1) return _.sampleSize(counties, sample)
        return counties[Math.floor(Math.random() * counties.length)]
    },

    pt_countyOfParish(lang, i, sample, parish) {
        if (Array.isArray(parish)) parish = (sample > -1) ? parish.map(x => normalize(x)) : normalize(parish[i])
        else parish = normalize(parish)
        
        if (Array.isArray(parish)) return parish.map(c => {
            for (let dist of districts) {
                for (let count of dist.counties) {
                    let parishes = count.parishes.map(x => normalize(x))
                    if (parishes.includes(c)) return count.county
                }
            }
            return false
        })
        else {
            let county = false
            for (let dist of districts) {
                for (let count of dist.counties) {
                    let parishes = count.parishes.map(x => normalize(x))
                    if (parishes.includes(parish)) county = count.county
                }
            }

            return (sample > -1) ? Array(sample).fill(county) : county
        }
    },

    pt_countyFromDistrict(lang, i, sample, district) {
        if (Array.isArray(district)) district = (sample > -1) ? district.map(x => normalize(x)) : normalize(district[i])
        else district = normalize(district)
        
        let dists = districts.map(x => normalize(x.district))
        
        if (Array.isArray(district)) return district.map(d => {
            if (dists.includes(d)) {
                let counties = districts[dists.indexOf(d)].counties.map(x => x.county)
                return counties[Math.floor(Math.random() * counties.length)]
            }
            return false
        })
        else {
            if (dists.includes(district)) {
                let counties = districts[dists.indexOf(district)].counties.map(x => x.county)
                if (sample > -1) return _.sampleSize(counties, sample)
                return counties[Math.floor(Math.random() * counties.length)]
            }
            return false
        }
    },

    pt_parish(lang, i, sample) {
        const parishes = districts.map(x => x.counties.map(x => x.parishes).flat()).flat()
        if (sample > -1) return _.sampleSize(parishes, sample)
        return parishes[Math.floor(Math.random() * parishes.length)]
    },

    pt_parishFromDistrict(lang, i, sample, district) {
        if (Array.isArray(district)) district = (sample > -1) ? district.map(x => normalize(x)) : normalize(district[i])
        else district = normalize(district)
        
        let dists = districts.map(x => normalize(x.district))
        
        if (Array.isArray(district)) return district.map(d => {
            if (dists.includes(d)) {
                let parishes = districts[dists.indexOf(d)].counties.map(x => x.parishes).flat()
                return parishes[Math.floor(Math.random() * parishes.length)]
            }
            return false
        })
        else {
            if (dists.includes(district)) {
                let parishes = districts[dists.indexOf(district)].counties.map(x => x.parishes).flat()
                if (sample > -1) return _.sampleSize(parishes, sample)
                return parishes[Math.floor(Math.random() * parishes.length)]
            }
            return false
        }
    },

    pt_parishFromCounty(lang, i, sample, county) {
        if (Array.isArray(county)) county = (sample > -1) ? county.map(x => normalize(x)) : normalize(county[i])
        else county = normalize(county)
        
        if (Array.isArray(county)) return county.map(c => {
            for (let d of districts) {
                let counts = d.counties.map(x => normalize(x.county))

                if (counts.includes(c)) {
                    let parishes = d.counties[counts.indexOf(c)].parishes
                    return parishes[Math.floor(Math.random() * parishes.length)]
                }
            }
            return false
        })
        else {
            for (let d of districts) {
                let counts = d.counties.map(x => normalize(x.county))

                if (counts.includes(county)) {
                    let parishes = d.counties[counts.indexOf(county)].parishes
                    if (sample > -1) return _.sampleSize(parishes, sample)
                    return parishes[Math.floor(Math.random() * parishes.length)]
                }
            }
            return false
        }
    },

    pt_city(lang, i, sample) {
        const cities = districts.map(x => x.cities.map(x => x.city)).flat()
        if (sample > -1) return _.sampleSize(cities, sample)
        return cities[Math.floor(Math.random() * cities.length)]
    },

    pt_cityFromDistrict(lang, i, sample, district) {
        if (Array.isArray(district)) district = (sample > -1) ? district.map(x => normalize(x)) : normalize(district[i])
        else district = normalize(district)
        
        let dists = districts.map(x => normalize(x.district))
        
        if (Array.isArray(district)) return district.map(d => {
            if (dists.includes(d)) {
                let cities = districts[dists.indexOf(d)].cities.map(x => x.city)
                return cities[Math.floor(Math.random() * cities.length)]
            }
            return false
        })
        else {
            if (dists.includes(district)) {
                let cities = districts[dists.indexOf(district)].cities.map(x => x.city)
                if (sample > -1) return _.sampleSize(cities, sample)
                return cities[Math.floor(Math.random() * cities.length)]
            }
            return false
        }
    }
}

module.exports =  districtsAPI