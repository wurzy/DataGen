<template>
    <v-form ref="form" v-model="valid" lazy-validation class="px-3">
        <v-row>
            <v-col cols="12" sm="6">
                <v-text-field
                    v-model="new_settings.recursiv.lower"
                    :rules="[rules.required, rules.nonNegative, rules.lessThanUpper]"
                    type="number"
                    label="Limite inferior de recursividade"
                />
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field
                    v-model="new_settings.recursiv.upper"
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
            label='Máximo de ocorrências quando maxOccurs="unbounded"' 
        />
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
                recursiv: {lower: 0, upper: 3},
                unbounded: 10
            },
            rules: {
                required: v => !!v || "Valor obrigatório.",
                nonNegative: v => parseInt(v) >= 0 || "O valor não pode ser negativo.",
                lessThanUpper: v => parseInt(v) <= parseInt(this.new_settings.recursiv.upper) || "Não pode ser maior que o limite superior.",
                moreThanLower: v => parseInt(v) >= parseInt(this.new_settings.recursiv.lower) || "Não pode ser menor que o limite inferior."
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