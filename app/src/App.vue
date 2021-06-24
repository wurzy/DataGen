<template>
  <div id="app">
    <Navbar :key="forceUpdateKey" v-on:update="forceUpdate" @update_router="forceUpdate2"/>
    <router-view :key="forceUpdateKey2"></router-view>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue' 
export default {
  name: 'App',
  data() {
    return {
      forceUpdateKey: 1,
      forceUpdateKey2: 2
    }
  },
  methods: {
    forceUpdate(){
      this.forceUpdateKey++
      this.forceUpdateKey2++
    },
    forceUpdate2(){
      this.forceUpdateKey2++
    }
  },
  components:{
    Navbar
  }
}
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin-top: 60px;
}
</style>
