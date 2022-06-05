function notSubschema(json) {
    let notTypes = []

    for (let t in json.type) {
        if (!Object.keys(json.type[t]).length) { notTypes.push(t); delete json.type[t] }
        else {
            notGenericKeys(json.type[t])
            switch (t) {
                case "number": notNumeric(json.type[t]); break
                case "string": notString(json.type[t]); break
                case "object": notObject(json.type[t]); break
                case "array": notArray(json.type[t]); break
            }
        }
    }

    if (!Object.keys(json.type).length) {
        let types = ["string","number","object","array","null","boolean"]
        types = types.filter(t => !notTypes.includes(t))

        if (types.length > 1 && types.includes("null")) types.splice(types.indexOf("null"), 1)
        for (let t of types) json.type[t] = {}
    }
}

function notGenericKeys(json) {
    if ("const" in json) {
        json.notValues = json.const
        delete json.const
    }
    if ("enum" in json) {
        if ("notValues" in json) json.notValues = json.notValues.concat(json.enum)
        else json.notValues = json.enum
        delete json.enum
    }
    if ("default" in json) {
        json.notDefault = json.default
        delete json.default
    }
}

function notNumeric(json) {
    let invertSchema = (old_k, new_k) => {
        let value = json[old_k]
        Object.keys(json).map(k => delete json[k])
        json[new_k] = value
    }

    if ("integer" in json) {
        if (json.integer) json.integer = false
        else delete json.integer
    }
    if ("mininum" in json) invertSchema("minimum", "exclusiveMaximum")
    else if ("exclusiveMinimum" in json) invertSchema("exclusiveMinimum", "maximum")
    else if ("maximum" in json) invertSchema("maximum", "exclusiveMinimum")
    else if ("exclusiveMaximum" in json) invertSchema("exclusiveMaximum", "minimum")
    else {
        let {multipleOf, notMultipleOf} = json

        if (multipleOf !== undefined && notMultipleOf !== undefined) {
            let temp = multipleOf
            json.multipleOf = notMultipleOf
            json.notMultipleOf = temp
        }
        else if (multipleOf !== undefined) {
            json.notMultipleOf = multipleOf
            delete json.multipleOf
        }
        else if (notMultipleOf !== undefined) {
            json.multipleOf = notMultipleOf
            delete json.notMultipleOf
        }
    }
    return json
}

function notString(json) {
    if ("pattern" in json) json.pattern = `^((?!(${json.pattern})).){${"minLength" in json ? json.minLength : 10},${"maxLength" in json ? json.maxLength : 30}}`
    if ("format" in json) json.notFormat = [json.format]
    notSizeKeys(json, "minLength", "maxLength")
}

function notObject(json) {
    notProperties(json, ["properties","patternProperties"])
    notOtherElements(json, ["additionalProperties","unevaluatedProperties"])
    if ("required" in json && !("properties" in json)) {json.notRequired = json.required; delete json.required}
    if ("propertyNames" in json) notString(json.propertyNames.type.string)
    notSizeKeys(json, "minProperties", "maxProperties")
}

function notArray(json) {
    notOtherElements(json, ["items","unevaluatedItems"])
    notSizeKeys(json, "minItems", "maxItems")
    if ("uniqueItems" in json) json.uniqueItems = !json.uniqueItems

    if ("prefixItems" in json) {
        for (let i = 0; i < json.prefixItems.length; i++) notSubschema(json.prefixItems[i])
    }

    if ("contains" in json) {
        let notContainsTypes = []

        for (let i = 0; i < json.contains.length; i++) {
            if (json.contains[i].maxContains !== null) {
                json.contains[i].minContains = json.contains[i].maxContains + 1
                json.contains[i].maxContains = null
            }
            else if (json.contains[i].minContains !== null) {
                json.contains[i].maxContains = json.contains[i].minContains - (!json.contains[i].minContains ? 0 : 1)
                json.contains[i].minContains = null
            }
            else {
                let c = json.contains.splice(i--, 1)[0].contains

                for (let t in c.type) {
                    if (!Object.keys(c.type[t]).length) {
                        if (!notContainsTypes.includes(t)) notContainsTypes.push(t)
                        delete c.type[t]
                    }
                }

                if (Object.keys(c.type).length > 0) {
                    notSubschema(c)
                    if ("notContains" in json) json.notContains.push(c)
                    else json.notContains = [c]
                }
            }
        }

        if (!json.contains.length) delete json.contains
        if (notContainsTypes.length > 0) {
            if ("notContainsTypes" in json) json.notContainsTypes = json.notContainsTypes.concat(notContainsTypes.filter(t => !json.notContainsTypes.includes(t)))
            else json.notContainsTypes = notContainsTypes
        }
    }
}

function notSizeKeys(json, min, max) {
    if (max in json) {
        json[min] = json[max] + 1
        delete json[max]
    }
    else if (min in json) {
        json[max] = json[min] - (!json[min] ? 0 : 1)
        delete json[min]
    }
}

function notProperties(json, keys) {
    keys.filter(k => k in json).map(k => {
        for (let p in json[k]) {
            notSubschema(json[k][p])
            if (!Object.keys(json[k][p]).length) delete json[k][p]
        }
    })
}

function notOtherElements(json, keys) {
    keys.filter(k => k in json).map(k => {
        if (json[k] === false) json[k] = {type: {string: {}, number: {}, boolean: {}, null: {}, array: {}, object: {}}}
        else {
            let notTypes = Object.keys(json[k].type)
            notSubschema(json[k])

            notTypes = notTypes.filter(x => !Object.keys(json[k].type).includes(x))
            if (!Object.keys(json[k].type).length) json[k] = false
            else json["not" + k.charAt(0).toUpperCase() + k.slice(1)] = notTypes
        }
    })
}

module.exports = {
    notGenericKeys,
    notNumeric,
    notString,
    notObject,
    notArray
}