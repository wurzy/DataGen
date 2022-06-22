const inverter = require('./schema_inverter')

function extendSchema(json, schema, type, key, SETTINGS) {
    if (key == "not") {
        inverter.notGenericKeys(schema)
        switch (type) {
            case "number": inverter.notNumeric(schema); break
            case "string": inverter.notString(schema); break
            case "object": inverter.notObject(schema); break
            case "array": inverter.notArray(schema); break
        }
    }
    
    extendArrayKey(json, schema, ["const","enum","default","notValues","notDefault"])
    switch (type) {
        case "number": extendNumeric(json, schema); break
        case "string": extendString(json, schema); break
        case "object": extendObject(json, schema, SETTINGS); break
        case "array": extendArray(json, schema, SETTINGS); break
    }
}

function extendArrayKey(json, schema, keys) {
    keys.filter(k => k in schema).map(key => {
        if (key in json) json[key] = json[key].concat(schema[key].filter(x => !json[key].includes(x)))
        else json[key] = schema[key]
    })
}

function extendString(json, schema) {
    if ("pattern" in schema) json.pattern = schema.pattern
    if ("format" in schema) json.format = schema.format
    extendArrayKey(json, schema, ["notFormat"])
    extendSizeKeys(json, schema, "minLength", "maxLength")
}

function extendNumeric(json, schema) {
    let {minimum, maximum, exclusiveMinimum, exclusiveMaximum} = schema
    if ("integer" in schema) json.integer = schema.integer

    extendArrayKey(json, schema, ["multipleOf","notMultipleOf"])

    if (minimum !== undefined) {
        if ("minimum" in json) {
            if (minimum > json.minimum) json.minimum = minimum
        } 
        else if ("exclusiveMinimum" in json) {
            if (minimum > json.exclusiveMinimum) {json.minimum = minimum; delete json.exclusiveMinimum}
        }
        else json.minimum = minimum

        if ("maximum" in json && json.minimum > json.maximum) delete json.maximum
        else if ("exclusiveMaximum" in json && json.minimum >= json.exclusiveMaximum) delete json.exclusiveMaximum
    }
    else if (exclusiveMinimum !== undefined) {
        if ("minimum" in json) {
            if (exclusiveMinimum >= json.minimum) {json.exclusiveMinimum = exclusiveMinimum; delete json.minimum}
        } 
        else if ("exclusiveMinimum" in json) {
            if (exclusiveMinimum > json.exclusiveMinimum) json.exclusiveMinimum = exclusiveMinimum
        }
        else json.exclusiveMinimum = exclusiveMinimum

        if ("maximum" in json && json.exclusiveMinimum >= json.maximum) delete json.maximum
        else if ("exclusiveMaximum" in json && json.exclusiveMinimum >= json.exclusiveMaximum) delete json.exclusiveMaximum
    }

    if (maximum !== undefined) {
        if ("maximum" in json) {
            if (maximum < json.maximum) json.maximum = maximum
        } 
        else if ("exclusiveMaximum" in json) {
            if (maximum < json.exclusiveMaximum) {json.maximum = maximum; delete json.exclusiveMaximum}
        }
        else json.maximum = maximum

        if ("minimum" in json && json.maximum < json.minimum) delete json.minimum
        else if ("exclusiveMinimum" in json && json.maximum <= json.exclusiveMinimum) delete json.exclusiveMinimum
    }
    else if (exclusiveMaximum !== undefined) {
        if ("maximum" in json) {
            if (exclusiveMaximum <= json.maximum) {json.exclusiveMaximum = exclusiveMaximum; delete json.maximum}
        } 
        else if ("exclusiveMaximum" in json) {
            if (exclusiveMaximum < json.exclusiveMaximum) json.exclusiveMaximum = exclusiveMaximum
        }
        else json.exclusiveMaximum = exclusiveMaximum

        if ("minimum" in json && json.exclusiveMaximum <= json.minimum) delete json.minimum
        else if ("exclusiveMinimum" in json && json.exclusiveMaximum <= json.exclusiveMinimum) delete json.exclusiveMinimum
    }
}

function extendObject(json, schema, SETTINGS) {
    assignProperties(json, schema, ["properties","patternProperties"], SETTINGS.extend_objectProperties)
    assignSchemaObject(json, schema, ["additionalProperties","unevaluatedProperties","propertyNames"], SETTINGS.extend_schemaProperties)
    extendSizeKeys(json, schema, "minProperties", "maxProperties")
    extendArrayKey(json, schema, ["required","notRequired","notAdditionalProperties","notUnevaluatedProperties"])
}

function extendArray(json, schema, SETTINGS) {
    assignSchemaObject(json, schema, ["items","unevaluatedItems"], SETTINGS.extend_schemaProperties)
    extendSizeKeys(json, schema, "minItems", "maxItems")
    extendArrayKey(json, schema, ["contains","notContains","notContainsTypes","notItems","notUnevaluatedItems"])
    if ("uniqueItems" in schema) json.uniqueItems = schema.uniqueItems

    if ("prefixItems" in schema) {
        let setting = SETTINGS.extend_prefixItems

        if ("prefixItems" in json && setting != "OWT") {
            if (/^O/.test(setting)) {
                for (let i = 0; i < schema.prefixItems.length; i++) {
                    if (i < json.prefixItems.length) {
                        // OR dá extend às schemas que se encontram no mesmo índice
                        if (setting == "OR") assignSubschema(json.prefixItems[i], schema.prefixItems[i])
                        // OWP dá overwrite apenas às schemas que se encontram no mesmo índice
                        if (setting == "OWP") json.prefixItems[i] = schema.prefixItems[i]
                    }
                    else json.prefixItems.push(schema.prefixItems[i])
                }
            }
            // AP dá append aos prefixItems antigo e novo
            if (setting == "AP") json.prefixItems = json.prefixItems.concat(schema.prefixItems)
        }
        // OWT dá overwrite completo do prefixItems antigo pelo novo
        else json.prefixItems = schema.prefixItems
    }
}

function extendSizeKeys(json, schema, min, max) {
    if (min in schema) {
        if (min in json) {
            if (schema[min] > json[min]) json[min] = schema[min]
        } 
        else json[min] = schema[min]

        if (max in json && json[max] < json[min]) delete json[max]
    }

    if (max in schema) {
        if (max in json) {
            if (schema[max] < json[max]) json[max] = schema[max]
        } 
        else json[max] = schema[max]

        if (min in json && json[min] > json[max]) delete json[min]
    }
}

function assignProperties(json, schema, keys, setting) {
    keys.filter(k => k in schema).map(k => {
        if (k in json) {
            for (let p in schema[k]) {
                if (p in json[k] && setting == "OR") assignSubschema(json[k][p], schema[k][p])
                else json[k][p] = schema[k][p]
            }
        }
        else json[k] = schema[k]
    })
}

function assignSchemaObject(json, schema, keys, setting) {
    keys.filter(k => k in schema).map(k => {
        if (k in json) {
            if (typeof json[k] == "boolean" || typeof schema[k] == "boolean") json[k] = schema[k]
            else {
                if (setting == "OR") assignSubschema(json[k], schema[k])
                else json[k] = schema[k]
            }
        }
        else json[k] = schema[k]
    })
}

function assignSubschema(json, schema) {
    for (let t in schema.type) {
        if (t in json.type && Object.keys(schema.type[t]).length > 0) extendSchema(json.type[t], schema.type[t], t, null)
        else json.type[t] = schema.type[t]
    }
}

module.exports = { extendSchema }