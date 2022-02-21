<template>
    <v-dialog v-model="dialog" @click:outside="closeDialog" max-width="600px">
        <template v-slot:activator="{ on }">
            <v-btn depressed fab small color="blue-grey lighten-4" class="sucess" v-on="on">
                <v-icon>mdi-cog</v-icon>
            </v-btn>
        </template>
        <v-card>
            <v-card-title>
                Definições do processo de geração
            </v-card-title>
            <v-card-text>
                <v-form ref="form" v-model="valid" lazy-validation class="px-3">
                    <v-text-field
                        v-model="settings.UNBOUNDED"
                        :rules="[rules.required, rules.nonNegative]"
                        type="number"
                        label='Máximo de ocorrências quando maxOccurs="unbounded"' 
                    />

                    <v-container class="px-0">
                        <!--div style="align-self: start">Recursividade de objetos:</div-->
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    v-model="settings.RECURSIV.LOWER"
                                    :rules="[rules.required, rules.nonNegative, rules.lessThanUpper]"
                                    type="number"
                                    label="Limite inferior de recursividade"
                                />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    v-model="settings.RECURSIV.UPPER"
                                    :rules="[rules.required, rules.nonNegative]"
                                    type="number"
                                    label="Limite superior de recursividade"
                                />
                            </v-col>
                        </v-row>
                    </v-container>

                    <v-card-actions class="px-0">
                        <v-btn :disabled="!valid" @click="save">Guardar</v-btn>
                    </v-card-actions>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    data() {
        return {
            valid: true,
            dialog: false,
            unsaved_settings: {},
            settings: {
                UNBOUNDED: 10,
                RECURSIV: {LOWER: 0, UPPER: 3}
            },
            rules: {
                required: v => !!v || "Valor obrigatório.",
                nonNegative: v => parseInt(v) >= 0 || "O valor não pode ser negativo.",
                lessThanUpper: v => parseInt(v) <= parseInt(this.settings.RECURSIV.UPPER) || "Não pode ser maior que o limite superior."
            }
        }
    },
    methods: {
        save() {
            this.$emit('saved', this.settings)
            this.dialog = false
        },
        closeDialog() {
            this.settings = JSON.parse(JSON.stringify(this.unsaved_settings))
            this.$refs.form.resetValidation()
        }
    },
    watch: {
        dialog(visible) {
            if (visible) this.unsaved_settings = JSON.parse(JSON.stringify(this.settings))
        }
    }
}
</script>