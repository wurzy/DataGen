<template>
  <v-app id="app">
    <Navbar :format="from_format" @changed="updateFromFormat"/>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import Navbar from '@/components/Navbar'

export default {
  name: 'App',
  components: { Navbar },

  data() {
    return {
      from_format: "XML"
    }
  },
  created() { this.changedInputMode("xml") },
  methods: {
    updateFromFormat(format) {
      this.from_format = format
      this.changedInputMode(format == "XML" ? "xml" : "javascript")
    },
    changedInputMode(mode) {
      window.dispatchEvent(new CustomEvent("changed-input_mode", {
        detail: { storage: {mode, format: this.from_format} }
      }))
    }
  }
}
</script>

<style scoped>
@import './utils/colors.css';

#app {
  height: 100vh !important;
  max-height: 100vh !important;
  overflow: hidden !important;
}
</style>