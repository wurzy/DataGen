<template>
    <v-btn-toggle :key="loading" v-model="from_format" mandatory @change="updateFormat">
        <v-btn
            :value="'XML'" 
            color="green" 
            dark 
            class="font-weight-bold" 
            :class="[{'disable-events': loading}, {'white--text': from_format=='XML'}, {'grey--text text--lighten-2': from_format=='JSON'}]"
        >
            XML
        </v-btn>
        <v-btn
            :value="'JSON'" 
            color="blue" 
            dark 
            class="font-weight-bold" 
            :class="[{'disable-events': loading}, {'white--text': from_format=='JSON'}, {'grey--text text--lighten-2': from_format=='XML'}]"
        >
            JSON
        </v-btn>
    </v-btn-toggle>
</template>

<script>
export default {
    props: {
        format: String,
        loading: Boolean
    },
    data() {
        return {
            from_format: ""
        }
    },
    mounted() { this.from_format = this.format },
    methods: {
        updateFormat() { if (!this.loading) this.$emit('changed', this.from_format) }
    },
    watch: {
        format() { this.from_format = this.format }
    }
}
</script>

<style scoped>
.disable-events {
  pointer-events: none
}
</style>