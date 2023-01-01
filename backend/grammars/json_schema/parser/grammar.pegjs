// Gramática de JSON Schema para "DataGen from Schemas" -----
{
  let depth = []
  let current_key = ""
  let ids = []
  let subschemas = []
  let anon_schemas = 0
  let refs = []
  let anchors = []
  let propertyNames_refs = []

  // chave só permitida na raiz
  const atRoot = kw => !depth[depth.length-1] ? true : error(`A chave <b>${kw}</b> só é permitida ao nível da raiz da (sub)schema!`)
  // todos os ids devem ser únicos
  const newId = id => !ids.includes(id) ? true : error(`Todas as propriedades <b>$id</b> devem ser únicas! Há mais do que uma (sub)schema cujo <b>$id</b> é <i>${id}</i>.`)
}

// ----- Dialect -----

Dialect = ws false ws {return error("A schema não pode ser falsa, pois nesse caso é impossível gerar qualquer valor!")}
        / ws schema:schema_object ws {return {schema, subschemas, pn_refs: propertyNames_refs}}

begin_array     = ws "[" ws {depth[depth.length-1]++}
begin_object    = ws "{" ws {depth[depth.length-1]++}
end_array       = ws "]" ws {depth[depth.length-1]--}
end_object      = ws "}" ws {depth[depth.length-1]--}
name_separator  = ws ":" ws
value_separator = ws "," ws

ws "whitespace" = [ \t\n\r]*

value = boolean / null / object / array / number / string
boolean = false / true

false = "false" { return false; }
null  = "null"  { return null;  }
true  = "true"  { return true;  }


// ----- Keywords -----
keyword = datagen_keyword / generic_keyword / string_keyword / number_keyword / object_keyword / array_keyword / 
          media_keyword / schemaComposition_keyword / conditionalSubschemas_keyword / structuring_keyword

// ---------- Keywords generic ----------
generic_keyword = kw_type / kw_enum / kw_const / kw_default / annotation_keyword

kw_type = QM key:"type" QM name_separator value:type_value {return {key, value}}
type_value = t:type {return [t]} / arr:type_array {return arr}
type = QM v:$("string" / "number" / "integer" / "object" / "array" / "boolean" / "null") QM {return v}

kw_enum = QM key:"enum" QM name_separator value:array {return {key, value}}
kw_const = QM key:"const" QM name_separator value:value {return {key, value: [value]}}
kw_default = QM key:"default" QM name_separator value:value {return {key, value: [value]}}

// ---------- Keywords annotation ----------
annotation_keyword = (kws_annotation_stringValues / kw_examples / kws_annotation_booleanValues) {return null}

kws_annotation_stringValues = QM key:$("title"/"description"/"$comment") QM name_separator value:string {return {key, value}}
kw_examples = QM key:"examples" QM name_separator value:array {return {key, value}}
kws_annotation_booleanValues = QM key:$("readOnly"/"writeOnly"/"deprecated") QM name_separator value:boolean {return {key, value}}

// ---------- Keywords string ----------
string_keyword = kws_string_length / kw_pattern / kw_format

kws_string_length = QM key:$("minLength"/"maxLength") QM name_separator value:int {return {key, value}}
kw_pattern = QM key:"pattern" QM name_separator value:pattern_string {return {key, value}}

kw_format = QM key:"format" QM name_separator value:format_value {return {key, value}}
format_value = QM f:("date-time" / "time" / "date" / "duration" / "email" / "idn-email" / "hostname" / "idn-hostname" / "ipv4" / "ipv6"
               / "uuid" / "uri-reference" / "uri-template" / "uri" / "iri-reference" / "iri" / "json-pointer" / "relative-json-pointer" / "regex") QM {return f}

// ---------- Keywords number ----------
number_keyword = kw_multipleOf / kws_range

kw_multipleOf = QM key:"multipleOf" QM name_separator value:positiveNumber {return {key, value: [value]}}
kws_range = QM key:$("minimum"/"exclusiveMinimum"/"maximum"/"exclusiveMaximum") QM name_separator value:number {return {key, value}}

// ---------- Keywords object ----------
object_keyword = kws_props / kw_moreProps / kw_requiredProps / kw_propertyNames / kws_size

kws_props = QM key:$("patternProperties"/"properties") QM name_separator value:object_schemaMap &{return aux.checkFalseProp(key, value, error)} {return {key, value}}
kw_moreProps = QM key:$("additionalProperties"/"unevaluatedProperties") QM name_separator value:schema_object {return {key, value}}
kw_requiredProps = QM key:"required" QM name_separator value:string_array {return {key, value}}
kw_propertyNames = QM key:$("propertyNames" {current_key = "propertyNames"}) QM name_separator value:schema_object &{return aux.checkPropertyNamesType(value, error)} {current_key = ""; return {key, value: typeof value == "boolean" ? {type: {def: true, string: {}}} : value}}
kws_size = QM key:$("minProperties"/"maxProperties") QM name_separator value:int {return {key, value}}

// ---------- Keywords array ----------
array_keyword = kw_items / kw_prefixItems / kw_unevaluatedItems / kw_contains / kws_mContains / kws_array_length / kw_uniqueness

kw_items = QM key:"items" QM name_separator value:schema_object {return {key, value}}
kw_prefixItems = QM key:"prefixItems" QM name_separator value:schema_array {return {key, value}}
kw_unevaluatedItems = QM key:"unevaluatedItems" QM name_separator value:schema_object {return {key, value}}
kw_contains = QM key:"contains" QM name_separator value:schema_object &{return aux.checkFalseSchema(key, value, error)} {return {key, value}}
kws_mContains = QM key:$("minContains"/"maxContains") QM name_separator value:int {return {key, value}}
kws_array_length = QM key:$("minItems"/"maxItems") QM name_separator value:int {return {key, value}}
kw_uniqueness = QM key:"uniqueItems" QM name_separator value:boolean {return {key, value}}

// ---------- Keywords media ----------
media_keyword = (kw_contentMediaType / kw_contentEncoding / kw_contentSchema) {return null}

kw_contentMediaType = QM key:"contentMediaType" QM name_separator value:string {return {key, value}}

kw_contentEncoding = QM key:"contentEncoding" QM name_separator value:encoding {return {key, value}}
encoding = QM e:$("7bit" / "8bit" / "binary" / "quoted-printable" / "base16" / "base32" / "base64") QM {return e}

kw_contentSchema = QM key:"contentSchema" QM name_separator value:schema_object {return {key, value}}

// ---------- Keywords schema composition ----------
schemaComposition_keyword = kws_combineSchemas / kw_notSchema

kws_combineSchemas = QM key:$("allOf"/"anyOf"/"oneOf") QM name_separator value:schema_array &{return aux.checkCompositionTypes(key, value, error)} {return {key, value}}
kw_notSchema = QM key:$("not" {current_key = "not"}) QM name_separator value:schema_object {current_key = ""; return {key, value}}

// ---------- Keywords conditional subschemas ----------
conditionalSubschemas_keyword = kw_dependentRequired / kw_dependentSchemas / kw_ifThenElse

kw_dependentRequired = QM key:"dependentRequired" QM name_separator value:object_arrayOfStringsMap {return {key, value}}
kw_dependentSchemas = QM key:"dependentSchemas" QM name_separator value:object_schemaMap &{return aux.checkFalseProp(key, value, error)} {return {key, value}}
kw_ifThenElse = QM key:$(k:("if"/"then"/"else") {current_key = k}) QM name_separator value:schema_object &{return key != "if" ? aux.checkFalseSchema(key,value,error) : true} {current_key = ""; return {key, value}}

// ---------- Keywords structuring ----------
structuring_keyword = kw_schema / kw_id / kw_anchor / kw_ref / kw_defs

kw_schema = QM key:"$schema" QM name_separator value:schema_value &{return atRoot(key)} {return null}//{key, value}}
schema_value = QM v:$("http://json-schema.org/draft-0"[467]"/schema#" / "https://json-schema.org/draft/20"("19-09"/"20-12")"/schema") QM
               &{return v == "https://json-schema.org/draft/2020-12/schema" ? true : error("Esta ferramenta implementa apenas a sintaxe do <b>draft 2020-12</b>!")} {return v}

kw_id = QM key:"$id" QM name_separator value:schema_id &{return atRoot(key) && newId(value)} {ids.push(value); return {key, value}}
kw_anchor = QM key:"$anchor" QM name_separator value:anchor {return {key, value}}
kw_ref = QM key:"$ref" QM name_separator value:schema_ref {return {key, value}}
kw_defs = QM key:"$defs" QM name_separator value:object_schemaMap {return {key, value}}


// ----- Objects -----

schema_object
  = boolean:boolean { return structureSchemaData(null, boolean, {current_key, error}) } /
    (ws "{" ws {depth.push(0); refs.push([]); anchors.push({})}) members:(
      head:keyword tail:(value_separator m:keyword { return m; })* {
        var result = {};
        [head].concat(tail).forEach(el => {if (el !== null) result[el.key] = el.value});
        return result;
    })? (ws "}" ws {depth.pop()})
    &{ return checkSchema(members, error) }
    { 
      let schema = structureSchemaData(members, null, {current_key, error})

      if ("$ref" in schema) refs[refs.length-1].push(schema)
      if ("$anchor" in schema) {
        let anchor_name = schema.$anchor
        delete schema.$anchor
        anchors[anchors.length-1][anchor_name] = schema
      }

      let new_refs = refs.pop()
      let new_anchors = anchors.pop()

      // guardar subschema se tiver um id ou se for a própria schema
      if ("$id" in schema || !refs.length) {
        let id = "$id" in schema ? schema.$id : ("anon" + ++anon_schemas)
        if ("$id" in schema) delete schema.$id
        subschemas.push({id, schema, refs: new_refs, anchors: new_anchors})
      }
      else {
        refs.push(refs.pop().concat(new_refs))
        Object.assign(anchors[anchors.length-1], new_anchors)
      }
      
      return schema
    }

object
  = begin_object members:(
      head:member tail:(value_separator m:member { return m; })* {
        var result = {};
        [head].concat(tail).forEach(el => {result[el.name] = el.value});
        return result;
    })? end_object
    { return members !== null ? members: {}; }

member = name:string name_separator value:value {return {name, value}}

object_schemaMap
  = begin_object members:(
      head:schema_member tail:(value_separator m:schema_member { return m; })* {
        var result = {};
        [head].concat(tail).forEach(el => {result[el.name] = el.value});
        return result;
    })? end_object
    { return members !== null ? members: {}; }

schema_member = name:string name_separator value:schema_object {return {name, value}}

object_arrayOfStringsMap
  = begin_object members:(
      head:arrayOfStrings_member tail:(value_separator m:arrayOfStrings_member { return m; })* {
        var result = {};
        [head].concat(tail).forEach(el => {result[el.name] = el.value});
        return result;
    })? end_object
    { return members !== null ? members: {}; }

arrayOfStrings_member = name:string name_separator value:string_array {return {name, value}}


// ----- Arrays -----

array "array"
  = begin_array values:(
      head:value tail:(value_separator v:value { return v; })*
    { return [head].concat(tail); }
    )? end_array
    { return values !== null ? values : []; }

string_array "array of strings"
  = begin_array values:(
      head:string tail:(value_separator v:string { return v; })*
    { return [head].concat(tail); }
    )? end_array
    { return values !== null ? values : []; }

schema_array "array of schemas"
  = begin_array values:(
      head:schema_object tail:(value_separator v:schema_object { return v; })*
    { return [head].concat(tail); }
    ) end_array
    { return values !== null ? values : []; }

type_array "array of JSON types"
  = begin_array values:(
      head:type tail:(value_separator v:type { return v; })*
    { return tail.includes(head) ? error("Os elementos do array <b>type</b> devem ser todos únicos!") : [head].concat(tail); }
    )? end_array
    { return values !== null ? values : error("O array de tipos não pode ser vazio!"); }


// ----- Numbers -----

number "number" = "-"? int frac? { return parseFloat(text()); }
positiveNumber "positive number" = ("0" frac / [1-9] [0-9]* frac?) { return parseFloat(text()); }

exp = [eE] ("-"/"+")? [0-9]+
frac = "." [0-9]+

int "integer" = integer:(("0"* i:([1-9] [0-9]*) {return i}) / (i:"0" "0"* {return i})) {return parseInt(Array.isArray(integer) ? integer.flat().join("") : integer)}


// ----- Strings -----

string "string" = QM str:$char* QM {return str}
pattern_string = QM str:$[^"]* QM {return str}
anchor "anchor" = QM value:anchor_value QM {return value}
schema_id = QM "https://datagen.di.uminho.pt"? id:$("/schemas" ("/" [^/#"]+)+) QM {return id}
schema_ref "$ref" = QM "https://datagen.di.uminho.pt"? ref:$(("/schemas/" [^/#"]+)? ref_segment / "/schemas/" [^/#"]+) QM {if (current_key == "propertyNames") propertyNames_refs.push(ref); return ref}

anchor_value = $([a-zA-Z][a-zA-Z0-9\-\_\:\.]*)
ref_segment = "#" (anchor_value / ("/" [^/#"]+)*)

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape = "\\"
QM = '"'

unescaped = [^\0-\x1F\x22\x5C]
HEXDIG = [0-9a-f]i


// ---------- Keyword datagen ----------

datagen_keyword = QM key:"_datagen" QM name_separator QM f:(func:("pattern" {return {func: text(), type: "string"}}) args:pattern_arg {return {func, args}} / func:datagen_func args:datagen_args? {return {func, args}}) QM {return {key, value: {...f.func, args: f.args!==null ? f.args.replace(/'/g, '"') : "()"}}}

datagen_func = datagen_boolean / datagen_integer / datagen_float / datagen_string

datagen_boolean = func:"boolean" {return {func, type: "boolean"}}
datagen_integer = func:("index"/"integerOfSize"/"integer") {return {func, type: "integer"}}
datagen_float = func:("float"/"multipleOf") {return {func, type: "number"}}
datagen_string = func:("date"/"formattedInteger"/"formattedFloat"/"guid"/"hexBinary"/"language"/"letter"/"lorem"/"objectID"/"position"/"pt_phone_number"/"stringOfSize"/"time"/"xsd_dateTime"/"xsd_date"/"xsd_duration"/"xsd_gDay"/"xsd_gMonthDay"/"xsd_gMonth"/"xsd_gYearMonth"/"xsd_gYear"/"xsd_string"/"actor"/"animal"/"brand"/"buzzword"/"capital"/"car_brand"/"continent"/"country"/"cultural_center"/"firstName"/"fullName"/"gov_entity"/"hacker"/"job"/"month"/"musician"/"nationality"/"political_party_abbr"/"political_party_name"/"pt_businessman"/"pt_city"/"pt_county"/"pt_district"/"pt_entity_abbr"/"pt_entity_name"/"pt_parish"/"pt_politician"/"pt_public_figure"/"pt_top100_celebrity"/"religion"/"soccer_club"/"soccer_player"/"sport"/"surname"/"top100_celebrity"/"weekday"/"writer") {return {func, type: "string"}}

datagen_args = "(" datagen_args_content? datagen_args_close ws {return text()}
datagen_args_content = (!datagen_args_close). datagen_args_content*
datagen_args_close = ")"

pattern_arg = "(" "'" pattern_arg_content? pattern_arg_close ws {return text()}
pattern_arg_content = (!pattern_arg_close). pattern_arg_content*
pattern_arg_close = "'" ")"