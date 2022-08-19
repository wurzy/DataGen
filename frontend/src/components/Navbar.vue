<template>
<div>
  <Login v-on:logged_in="loggedIn"/>
  <Register v-on:register_ok="registerOk" :key="registerKey"/>

  <nav class="navbar navbar-expand-lg navbar-light bg-light shadow fixed-top">
   <div class="container">
    <router-link to="/" class="navbar-brand">
      DataGen
    </router-link>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarResponsive" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
    <div class="collapse navbar-collapse" id="navbarResponsive">
      <ul class="navbar-nav ml-auto">
        <div v-if="isHome">
          <router-link to="/" class="nav-link" >
            <li class="nav-item active">
              <font-awesome-icon icon="download"/> Gerar<span class="sr-only">(current)</span>
            </li>
          </router-link>
        </div>
        <div v-else>
          <router-link to="/" class="nav-link" >
            <li class="nav-item">
              <font-awesome-icon icon="download"/> Gerar
            </li>
          </router-link>
        </div>
        <div v-if="isModelList">
          <router-link to="modelos" class="nav-link">
            <li class="nav-item active">
              <font-awesome-icon icon="list"/> Modelos
              <span class="sr-only">(current)</span>
            </li>
          </router-link>
        </div>
        <div v-else>
          <router-link to="modelos" class="nav-link">
            <li class="nav-item">
              <font-awesome-icon icon="list"/> Modelos
            </li>
          </router-link>
        </div>
        <div v-if="isDocumentation">
          <router-link to="documentacao" class="nav-link">
            <li class="nav-item active">
              <font-awesome-icon icon="file-alt"/> Documentação
              <span class="sr-only">(current)</span>
            </li>
          </router-link>
        </div>
        <div v-else>
          <router-link to="documentacao" class="nav-link">
            <li class="nav-item">
              <font-awesome-icon icon="file-alt"/> Documentação
            </li>
          </router-link>
        </div>
        <div v-if="isAbout">
          <router-link to="sobre" class="nav-link">
            <li class="nav-item active">
              <font-awesome-icon icon="university"/> Sobre
              <span class="sr-only">(current)</span>
            </li>
          </router-link>
        </div>
        <div v-else>
          <router-link to="sobre" class="nav-link">
            <li class="nav-item">
              <font-awesome-icon icon="university"/> Sobre
            </li>
          </router-link>
        </div>
        <div>
          <li v-if="isLoggedIn" class="nav-item">
            <div class="dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" id="userDropDownMenu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
               <font-awesome-icon icon="user-alt"/> {{user.nome}}
              </a>

              <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                <router-link v-if="isAdmin" class="dropdown-item" to="colecoes"><font-awesome-icon icon="folder"/> Coleções</router-link>
                <router-link class="dropdown-item" to="meusmodelos"><font-awesome-icon icon="save"/> Modelos Guardados</router-link>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item" @click="logout"><font-awesome-icon icon="sign-out-alt"/> Logout</a>
              </div>
            </div>
          </li>
        </div>
        <div>
          <router-link to="" v-if="!isLoggedIn" class="nav-link" @click.native="login">
            <li class="nav-item">
              <font-awesome-icon icon="sign-out-alt"/> Login
            </li>
          </router-link>
        </div>
        <div>
          <router-link to="" v-if="!isLoggedIn" class="nav-link" @click.native="registar">
            <li class="nav-item">
              <font-awesome-icon icon="user-plus"/> Registar
            </li>
          </router-link>
        </div>
      </ul>
    </div>
  </div>
    <ul class="navbar-nav ml-auto">
      <div style="text-align: right;">
        <router-link to="" class="nav-link" @click.native="dfs">
          <li class="nav-item">
            <font-awesome-icon icon="external-link-alt"/>From Schemas
          </li>
        </router-link>
      </div>
    </ul>
 </nav>
</div>
</template>

<script>
import Register from './Register.vue';
import Login from './Login.vue';

import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import $ from 'jquery';
import axios from 'axios'

export default {
  name: "Navbar",
  components: {
    Register,
    Login
  },
  data(){
    return {
      user: { type: Object, default: () => ({}) },
      registerKey: 1
    }
  },
  computed: {
    isHome() {
      return this.$route.name == "Home";
    },
    isAbout() {
      return this.$route.name == "About";
    },
    isDocumentation() {
      return this.$route.name == "Documentation";
    },
    isLoggedIn(){
      return localStorage.getItem('token')!=null
    },
    isModelList(){
      return this.$route.name == "Models"
    },
    isAdmin(){
      return this.user.nivel == "admin"
    }
  },
  created() {
    if(localStorage.getItem('token')!=null){
      axios.get('/api/utilizadores/verificar/' + localStorage.getItem('token'))
      .then(dados=>{})
      .catch(error => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        this.$emit('update')
      })
    }
    this.user = JSON.parse(localStorage.getItem('user'))
  },
  methods: {
    dfs() { /* window.open("https://datagenfromschemas.di.uminho.pt/") */ },
    login(){
      $("#login_modal").modal("show");
      $("#login_modal").css("z-index", "1500");
    },
    registar(){
      $("#registar_modal").modal("show");
      $("#registar_modal").css("z-index", "1500");
    },
    logout(){
      axios.post('/api/utilizadores/logout', {token: localStorage.getItem('token')})
        .then(dados => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          this.$emit('update')
        })
        .catch(error => console.log(error))
    },
    async loggedIn(){
      const token = localStorage.getItem('token')
      if(token){
        const res = await axios.get('/api/utilizadores/' + localStorage.getItem('token'))
        localStorage.setItem('user', JSON.stringify(res.data))
        this.$emit('update_router')
      }
      this.$emit('update')
    },
    registerOk(){
      this.registerKey++
    }
  }
};
</script>