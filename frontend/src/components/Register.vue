<template>
<div>
    <Success type="register" msg="Registo efetuado com sucesso!" id="register_success_modal" v-on:register_ok="registerOk"/>
    <div id="registar_modal" class="modal fade">
      <div class="modal-dialog modal-login">
          <div class="modal-content">
              <div class="modal-header">
                  <div class="avatar">
                      <img src="https://www.tutorialrepublic.com/examples/images/avatar.png" alt="Avatar">
                  </div>
                  <h4 class="modal-title">Deseja registar-se?</h4>
                  <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
              </div>
              <div class="modal-body">
                  <form @submit.prevent="handleRegistar">
                      <div id="inject_error_register"></div>
                      <div class="form-group">
                          <input v-model="nome" type="text" class="form-control" name="nome" placeholder="Nome"
                              required="required">
                      </div>
                      <div class="form-group">
                          <input v-model="email" type="text" class="form-control" name="email" placeholder="E-mail"
                              required="required">
                      </div>
                      <div class="form-group">
                          <input v-model="password" type="password" class="form-control" name="password" placeholder="Palavra-passe" minlength="8"
                              required="required">
                      </div>
                      <div class="form-group">
                          <button type="submit" class="btn btn-primary btn-lg btn-block login-btn">Registar</button>
                      </div>
                  </form>
              </div>
              <div class="modal-footer">
                  <a href="#">Forgot Password?</a>
              </div>
          </div>
      </div>
  </div> 
</div>
</template>

<script>
import Success from './Success.vue';
import $ from 'jquery';
import axios from 'axios'

export default {
    name: "Register",
    components: {
      Success
    },
    data() {
        return {
          nome: "",
          email: "",
          password: "",
        }
    },
    methods: {
        async handleRegistar(){
          try{
            const res = await axios.post('/api/utilizadores/registar', {
              nome: this.nome,
              email: this.email,
              password: this.password
              })
            $("#registar_modal").modal("hide");
            $("#register_success_modal").modal("show");
            $("#register_success_modal").css("z-index", "1500");
          }
          catch(error) {
            const html=`<div id="remove_register_error" class="form-group">
                        <span class="form-control border-danger" style="text-align: center; color: black;background-color: #ff8080;">${error.response.data.error}</span>
                      </div>`
            const inject = $('#inject_error_register')
            if(inject.children().length > 0) {
              $('#remove_register_error').remove()
            }
            inject.append(html)
          }
        },
        registerOk() {
          this.$emit('register_ok')
        }
    }
}
</script>
<style scoped>
.modal-login {
  color: #636363;
  width: 350px;
  margin: 80px auto 0;
}
.modal-login .modal-content {
  padding: 20px;
  border-radius: 5px;
  border: none;
}
.modal-login .modal-header {
  border-bottom: none;
  position: relative;
  justify-content: center;
}
.modal-login h4 {
  text-align: center;
  font-size: 26px;
  margin: 30px 0 -15px;
}
.modal-login .form-control:focus {
  border-color: #007bff;
}
.modal-login .form-control,
.modal-login .btn {
  min-height: 40px;
  border-radius: 3px;
}
.modal-login .close {
  position: absolute;
  top: -5px;
  right: -5px;
}
.modal-login .modal-footer {
  background: #ecf0f1;
  border-color: #dee4e7;
  text-align: center;
  justify-content: center;
  margin: 0 -20px -20px;
  border-radius: 5px;
  font-size: 13px;
}
.modal-login .modal-footer a {
  color: #999;
}
.modal-login .avatar {
  position: absolute;
  margin: 0 auto;
  left: 0;
  right: 0;
  top: -70px;
  width: 95px;
  height: 95px;
  border-radius: 50%;
  z-index: 1055;
  background: #007bff;
  padding: 15px;
  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
}
.modal-login .avatar img {
  width: 100%;
}
.modal-login .btn {
  color: #fff;
  border-radius: 4px;
  background: #007bff;
  text-decoration: none;
  transition: all 0.4s;
  line-height: normal;
  border: none;
}
.modal-login .btn:hover,
.modal-login .btn:focus {
  background: #007bff;
  outline: none;
}
.modal-dialog{
  width:500px;
}
.modal {
  text-align: center;
  padding: 0!important;
}

.modal:before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  margin-right: -18px;
}

.modal-dialog {
  display: inline-block;
  text-align: left;
  vertical-align: middle;
  margin-bottom: 200px;
}

</style>