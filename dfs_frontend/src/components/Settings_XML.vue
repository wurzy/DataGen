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
        
        <v-text-field
            v-model="new_settings.unbounded"
            :rules="[rules.required, rules.nonNegative]"
            type="number"
            label="Máximo de ocorrências da instância de um elemento com o atributo 'maxOccurs' a 'unbounded'"
        />

        <v-text-field
            v-model="new_settings.prob_default"
            :rules="[rules.required, rules.probability]"
            type="number"
            min="0"
            max="100"
            label="Probabilidade de uma instância de um elemento <attribute>/<element> com o atributo 'default' ter esse valor predefinido"
        />

        <v-text-field
            v-model="new_settings.prob_nil"
            :rules="[rules.required, rules.probability]"
            type="number"
            min="0"
            max="100"
            label="Probabilidade de uma instância de <element> com o atributo 'nillable' a verdadeiro ter o valor explícito 'nil'"
        />

        <v-text-field
            v-model="new_settings.prob_noAll"
            :rules="[rules.required, rules.probability]"
            type="number"
            min="0"
            max="100"
            label="Probabilidade de um elemento <all> com o atributo 'minOccurs' a 0 não ocorrer na instância"
        />

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
                unbounded: 10,
                prob_default: 60,
                prob_nil: 30,
                prob_noAll: 30,
                datagen_language: "pt"
            },
            rules: {
                required: v => !!v || "Valor obrigatório.",
                nonNegative: v => parseInt(v) >= 0 || "O valor não pode ser negativo.",
                lessThanUpper: v => parseInt(v) <= parseInt(this.new_settings.recursion.upper) || "Não pode ser maior que o limite superior.",
                moreThanLower: v => parseInt(v) >= parseInt(this.new_settings.recursion.lower) || "Não pode ser menor que o limite inferior.",
                probability: v => parseInt(v) >= 0 && parseInt(v) <= 100 || "O valor deve ser uma probabilidade (entre 0 e 100)."
            }
        }
    },
    mounted() { this.new_settings = _.cloneDeep(this.settings) },
    watch: {
        valid() { this.$emit('updateValid', 'xml', this.valid) },
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