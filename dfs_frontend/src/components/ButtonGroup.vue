<template>
    <v-btn-toggle v-model="format" mandatory @change="updateFormat">
        <v-btn :value="'XML'" color="blue" dark class="font-weight-bold">
            XML
        </v-btn>
        <v-btn :value="'JSON'" color="green" dark class="font-weight-bold">
            JSON
        </v-btn>
    </v-btn-toggle>
</template>

<script>
export default {
    data() {
        return {
            format: "XML"
        }
    },
    methods: {
        updateFormat() { this.$emit('changed', this.format) }
    }
}
</script>