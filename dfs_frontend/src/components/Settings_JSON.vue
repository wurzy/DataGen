<template>
    <v-form ref="form" v-model="valid" lazy-validation class="px-3">
        <v-row>
            <v-col cols="12" sm="6">
                <v-text-field
                    v-model="new_settings.recursion.lower"
                    :rules="[rules.required, rules.nonNegative, rules.lessThanUpper]"
                    type="number"
                    label="Limite inferior de recursividade"
                />
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field
                    v-model="new_settings.recursion.upper"
                    :rules="[rules.required, rules.nonNegative, rules.moreThanLower]"
                    type="number"
                    label="Limite superior de recursividade"
                />
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12" sm="6">
                <v-text-field
                    v-model="new_settings.prob_if"
                    :rules="[rules.required, rules.probability]"
                    type="number"
                    min="0"
                    max="100"
                    label="Probabilidade de um 'if' ser verdadeiro"
                />
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field
                    v-model="new_settings.prob_patternProperty"
                    :rules="[rules.required, rules.probability]"
                    type="number"
                    min="0"
                    max="100"
                    label="Probabilidade de gerar uma propriedade a partir de uma 'patternProperty'"
                />
            </v-col>
        </v-row>

        <v-radio-group
            row
            v-model="new_settings.random_props"
            :rules="[rules.required_bool]"
            label="Gerar propriedades aleatórias (dentro do tamanho indicado) se não forem especificadas 'additionalProperties' nem 'unevaluatedProperties'"
        >
            <v-radio :label="'Sim'" :value="true" color="var(--json-primary)"/>
            <v-radio :label="'Não'" :value="false" color="var(--json-primary)"/>
        </v-radio-group>

        <v-row>
            <v-col cols="12" sm="4">
                <v-tooltip top max-width="420px">
                    <template v-slot:activator="{ on }">
                        <span class="label" v-on="on">Extensão de propriedades repetidas nas chaves 'properties' e 'patternProperties'</span>
                    </template>
                    <span>Como proceder ao estender alguma destas chaves com uma chave igual, através de chaves de combinação de schemas?</span>
                </v-tooltip>
                <v-select class="select"
                    :rules="[rules.required]"
                    v-model="new_settings.extend_objectProperties"
                    :items="options1"
                    item-text="label"
                    item-value="key"
                    label="Selecionar"
                    outlined
                    single-line
                >
                    <template #item="data">
                        <v-tooltip top max-width="435px">
                            <template v-slot:activator="{ on }">
                                <v-layout wrap v-on="on">
                                    <v-list-item-content>
                                        <v-list-item-title>{{data.item.label}}</v-list-item-title>
                                    </v-list-item-content>
                                </v-layout>
                            </template>
                            <span v-if="data.item.key=='OR'">Se as chaves tiverem propriedades repetidas, estende a schema de cada propriedade da chave-base com a respetiva schema da mesma propriedade da chave nova. Todas as propriedades originais da nova chave são atribuídas à chave-base.</span>
                            <span v-if="data.item.key=='OW'">Se as chaves tiverem propriedades repetidas, substitui a schema de cada propriedade da chave-base pela respetiva schema da mesma propriedade da chave nova. Todas as propriedades originais da nova chave são atribuídas à chave-base.</span>
                        </v-tooltip>
                    </template>
                </v-select>
            </v-col>

            <v-col cols="12" sm="4">
                <v-tooltip top max-width="510px">
                    <template v-slot:activator="{ on }">
                        <span class="label" v-on="on">Extensão de chaves cujo valor é uma subschema</span>
                    </template>
                    <span>Como proceder ao estender alguma destas chaves ('propertyNames', 'additionalProperties', 'unevaluatedProperties', 'items' ou 'unevaluatedItems') com uma chave igual, através de chaves de combinação de schemas?</span>
                </v-tooltip>
                <v-select class="select"
                    :rules="[rules.required]"
                    v-model="new_settings.extend_schemaProperties"
                    :items="options1"
                    item-text="label"
                    item-value="key"
                    label="Selecionar"
                    outlined
                    single-line
                >
                    <template #item="data">
                        <v-tooltip top max-width="500px">
                            <template v-slot:activator="{ on }">
                                <v-layout wrap v-on="on">
                                    <v-list-item-content>
                                        <v-list-item-title>{{data.item.label}}</v-list-item-title>
                                    </v-list-item-content>
                                </v-layout>
                            </template>
                            <span v-if="data.item.key=='OR'">Estende a schema da chave-base com a schema da chave nova.</span>
                            <span v-if="data.item.key=='OW'">Substitui a schema da chave-base pela schema da chave nova.</span>
                        </v-tooltip>
                    </template>
                </v-select>
            </v-col>

            <v-col cols="12" sm="4">
                <v-tooltip top max-width="410px">
                    <template v-slot:activator="{ on }">
                        <span class="label" v-on="on">Extensão da chave 'prefixItems'</span>
                    </template>
                    <span>Como proceder ao estender a chave 'prefixItems' com uma chave igual, através de chaves de combinação de schemas?</span>
                </v-tooltip>
                <v-select style="padding-top: 39px;"
                    :rules="[rules.required]"
                    v-model="new_settings.extend_prefixItems"
                    :items="options2"
                    item-text="label"
                    item-value="key"
                    label="Selecionar"
                    outlined
                    single-line
                >
                    <template #item="data">
                        <v-tooltip top max-width="410px">
                            <template v-slot:activator="{ on }">
                                <v-layout wrap v-on="on">
                                    <v-list-item-content>
                                        <v-list-item-title>{{data.item.label}}</v-list-item-title>
                                    </v-list-item-content>
                                </v-layout>
                            </template>
                            <span v-if="data.item.key=='OR'">Para todas as schemas que se encontram no mesmo índice, estende as da chave-base com as respetivas schemas da nova chave. Se a chave nova tiver mais elementos do que a base, os elementos extra são também concatenados.</span>
                            <span v-if="data.item.key=='OWP'">Sobrescreve apenas as schemas da chave-base com uma schema correspondente no mesmo índice, na chave nova. Se a chave nova tiver mais elementos do que a base, os elementos extra são também concatenados.</span>
                            <span v-if="data.item.key=='OWT'">O valor da chave-base é apagado totalmente e substítuido pelo array do novo 'prefixItems'.</span>
                            <span v-if="data.item.key=='AP'">Os elementos do novo 'prefixItems' são concatenados aos da chave-base.</span>
                        </v-tooltip>
                    </template>
                </v-select>
            </v-col>
        </v-row>

        <v-radio-group
            row
            v-model="new_settings.datagen_language"
            :rules="[rules.required]"
            label="Língua dos resultados de funções de interpolação do DataGen:"
        >
            <v-radio :label="'Português'" :value="'pt'" color="var(--json-primary)"/>
            <v-radio :label="'Inglês'" :value="'en'" color="var(--json-primary)"/>
        </v-radio-group>
    </v-form>
</template>

<script>
import _ from 'lodash'

export default {
    props: {
        settings: Object,
        result: Number
    },
    data() {
        return {
            valid: true,
            new_settings: {
                recursion: {lower: 0, upper: 3},
                prob_if: 50,
                prob_patternProperty: 80,
                random_props: false,
                extend_objectProperties: "OR",
                extend_prefixItems: "OR",
                extend_schemaProperties: "OR",
                datagen_language: "pt"
            },
            options1: [{key: "OR", label: "Extensão"}, {key: "OW", label: "Sobrescrição"}],
            options2: [{key: "OR", label: "Extensão"}, {key: "OWP", label: "Sobrescrição parcial"}, {key: "OWT", label: "Sobrescrição total"}, {key: "AP", label: "Concatenação"}],
            rules: {
                required: v => !!v || "Valor obrigatório.",
                required_bool: v => v === true || v === false || "Valor obrigatório.",
                nonNegative: v => parseInt(v) >= 0 || "O valor não pode ser negativo.",
                lessThanUpper: v => parseInt(v) <= parseInt(this.new_settings.recursion.upper) || "Não pode ser maior que o limite superior.",
                moreThanLower: v => parseInt(v) >= parseInt(this.new_settings.recursion.lower) || "Não pode ser menor que o limite inferior.",
                probability: v => parseInt(v) >= 0 && parseInt(v) <= 100 || "O valor deve ser uma probabilidade (entre 0 e 100)."
            }
        }
    },
    mounted() { this.new_settings = _.cloneDeep(this.settings) },
    watch: {
        valid() { this.$emit('updateValid', 'javascript', this.valid) },
        result() {
            if (this.result > 0) this.$emit('saved', this.new_settings)
            if (this.result < 0) {
                this.new_settings = _.cloneDeep(this.settings)
                this.$refs.form.resetValidation()
            }
        }
    }
}
</script>

<style scoped>
.label {
    font-size: 14px;
    min-height: 8px;
    cursor: text;
    height: auto;
    color: #8c8c8c;
    line-height: 15px;
    letter-spacing: normal;
    white-space: normal;
    border: 0;
    max-width: 100%;
    transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
    padding-bottom: 15px;
}

.select {
    padding-top: 15px !important;
}
</style>