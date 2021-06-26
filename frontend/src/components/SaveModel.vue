<template>
<div>
    <Success type="savemodel" msg="Modelo guardado com sucesso!" id="savemodel_success_modal"/>
    <div id="savemodels_modal" class="modal fade">
      <div class="modal-dialog modal-login">
          <div class="modal-content">
              <div class="modal-header">
                  <h4 class="modal-title">Guardar Modelo</h4>
                  <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
              </div>
              <div class="modal-body">
                  <form @submit.prevent="handleSaveModel">
                      <div id="inject_error_savemodel"></div>
                      <div class="form-group">
                          <input v-model="title" type="text" class="form-control" name="title" placeholder="Título"
                              required="required">
                      </div>
                      <div class="form-group">
                          <textarea v-model="description" class="form-control" name="description" placeholder="Descrição" required="required" rows="3"></textarea>
                      </div>
                      <div class="form-group">
                      <label class="switch">
                        <input id="saveModelSwitch" type="checkbox" @click="toggled()">
                        <span class="slider round"></span>
                      </label>
                      <span v-if="isToggled">
                        (<font-awesome-icon icon="lock-open"/> Público)
                      </span>
                      <span v-else>
                        (<font-awesome-icon icon="lock"/> Privado)
                      </span>
                      </div>
                      <div class="form-group">
                          <button type="submit" class="btn btn-primary btn-lg btn-block login-btn">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
  </div> 
</div>
</template>

<script>
import $ from 'jquery';
import axios from 'axios'
import Success from '../components/Success';

export default {
    name: "SaveModel",
    props:["model"],
    components:{
        Success
    },
    data() {
        return {
          title: "",
          description: "",
          switch: false
        }
    },
    methods: {
        async handleSaveModel(){
            try{
                let data = {
                    user: JSON.parse(localStorage.getItem('user'))._id,
                    modelo: this.$props.model,
                    visibilidade: this.switch,
                    titulo: this.title,
                    descricao: this.description,
                    dataCriacao: new Date()
                }
                axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
                await axios.post('/api/modelos/adicionar', data)
                this.title = ""
                this.description = ""
                this.switch = false
                document.getElementById("saveModelButton").disabled = true;
                $("#savemodels_modal").modal("hide");
                $("#savemodel_success_modal").modal("show");
                $("#savemodel_success_modal").css("z-index", "1500");
            }
            catch(error){
                const html=`<div id="remove_savemodel_error" class="form-group">
                            <span class="form-control border-danger" style="text-align: center; color: black;background-color: #ff8080;">${error.response.data.error}</span>
                          </div>`
                const inject = $('#inject_error_savemodel')
                if(inject.children().length > 0) {
                  $('#remove_savemodel_error').remove()
                }
                inject.append(html)
            }
        },
        toggled(){
            this.switch = !this.switch
        },

    },
    computed: {
        isToggled(){
            return this.switch
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

.switch {
    line-height: 22px;
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

label{
    margin-bottom: 0px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>