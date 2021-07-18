<template>
<div class="container" >
    <Confirm :msg="getConfirmMsg" id="deleteModel_confirm_modal" @confirm="confirm"/>
    <ConfirmAlteration :msg="getConfirmMsg2" id="alterModel_confirm_modal" @confirm="confirmAlteration"/>
    <h2 style="margin-top:85px" >Modelos Guardados</h2>
    <hr/>
    <div class="input-group">
          <input v-model="search" type="search" class="form-control" placeholder="Procurar por título..." aria-label="Search"/>
          <div class="input-group-append">
            <datepicker placeholder="Procurar entre..." v-model="dateInt" style="height: 100%;" range @clear="clearDate"></datepicker>
          </div>
    </div>
    <div class="row">
        <div class="col-md-12" style="margin-top:15px">
            <div class="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
                    <div class="panel panel-default" v-for="(model, idx) in getSlicedUserModels" :key="idx">
                        <div class="panel-heading" role="tab" :id="'heading' + model._id">
                            <h4 class="panel-title">
                                <a :id="'idCollapsible' + model._id" class="collapsed" role="button" data-toggle="collapse" data-parent="#accordion" :href="'#collapse' + model._id" aria-expanded="false" :aria-controls="'collapse' + model._id">
                                    {{model.titulo}} 
                                    <span style="color:gray">({{model.dataCriacao | moment("calendar")}})</span>
                                </a>
                            </h4>
                        </div>
                        <div :id="'collapse' + model._id" class="panel-collapse collapse" role="tabpanel" :aria-labelledby="'heading' + model._id">
                            <div class="panel-body">
                                <p>
                                    <b>Descrição:</b> {{model.descricao}}
                                </p>
                                <p>
                                    <b>Visibilidade: </b>
                                    <label class="switch">
                                      <input :id="'switch' + model._id" v-if="model.visibilidade" type="checkbox" checked @click="toggled(model._id)">
                                      <input :id="'switch' + model._id" v-else type="checkbox" @click="toggled(model._id)">
                                      <span class="slider round"></span>
                                    </label>
                                    <span v-if="model.visibilidade">
                                        (<font-awesome-icon icon="lock-open"/> Público)
                                    </span>
                                    <span v-else>
                                        (<font-awesome-icon icon="lock"/> Privado)
                                    </span>
                                </p>
                                <codemirror
                                    ref="cmEditor"
                                    v-model="model.modelo"
                                    :options="cmOption"                                    
                                />
                                <br/>
                                <p>
                                  <button  class="btn btn-success" style="margin-right: 5px" @click="saveModel(model._id,model.titulo)"><font-awesome-icon icon="save"/> Guardar</button>
                                  <button  class="btn btn-danger"  style="margin-right: 5px" @click="deleteModel(model._id,model.titulo)"><font-awesome-icon icon="trash"/> Eliminar</button>
                                  <router-link :to="{name: 'Home', params: {userModel: model.modelo}}">
                                    <button  class="btn btn-primary" style="margin-right: 5px"><font-awesome-icon icon="external-link-alt"/> Usar Modelo</button>
                                  </router-link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    </div>
    <paginate 
      id="pagination1"    
      :page-count="pages"
      :page-range="3"
      :margin-pages="2"
      :click-handler="clickCallback"
      :prev-text="''"
      :next-text="''"
      :container-class="'pagination'"
      :page-class="'page-item'">
    </paginate>
</div>
</template>

<script>
import axios from 'axios'
import Confirm from '../components/Confirm.vue'
import ConfirmAlteration from '../components/ConfirmAlteration.vue'

import "codemirror/theme/dracula.css";
import 'codemirror/keymap/sublime'
import 'codemirror/mode/javascript/javascript.js'
import "codemirror/addon/display/autorefresh.js"

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

import $ from 'jquery'

export default {
    name: "UserModels",
    components:{
      Confirm,
      ConfirmAlteration
    },
    data() {
        return {
            user: null,
            userModels: [],
            perPage: 10,
            currentPage: 1,
            search: '',
            dateInt: [null, new Date()],
            pages: 1,
            toDelete: {},
            toSave: {},
            confirmMsg: "Esta ação é irreversível. Tem a certeza que pretende remover o modelo \"-\"?",
            confirmMsg2: "Esta ação é irreversível. Tem a certeza que pretende alterar o modelo \"-\"?",
            cmOption: {
                tabSize: 4,
                autoRefresh: true,
                styleActiveLine: true,
                lineNumbers: true,
                line: true,
                foldGutter: true,
                styleSelectedText: true,
                mode: 'text/javascript',
                keyMap: "sublime",
                matchBrackets: true,
                showCursorWhenSelecting: true,
                theme: "dracula",
                extraKeys: { "Ctrl": "autocomplete" },
                hintOptions:{
                  completeSingle: false
                }
            }
        }
    },
    methods: {
        async getUserModels(){
            if(localStorage.getItem('token')) { 
              const res = await axios.get('/api/modelos/utilizador/' + this.user._id)
              this.userModels = res.data
              this.changePage(this.userModels)
            }
        },
        clickCallback(pageNum) {
          this.currentPage = Number(pageNum);
        },
        changePage(array){
          let newPages = Math.ceil(array.length / this.perPage);
          if(this.pages > newPages){
            this.currentPage = 1
            const selDoc = document.querySelector('#pagination1 li:nth-child(2) > a')
            if(selDoc) {
              selDoc.click()
            }
          }
          this.pages = newPages
        },
        isEmpty(){
            return this.userModels==null
        },
        toggled(id){
            for(let [k, m] of Object.entries(this.userModels)){
                if(m._id==id){
                    m.visibilidade = !m.visibilidade
                    return
                }
            }
        },
        async saveModel(id, titulo){
          this.toSave = {id, titulo}
          $("#alterModel_confirm_modal").modal("show");
          $("#alterModel_confirm_modal").css("z-index", "1500");
        },
        deleteModel(id, titulo){
          this.toDelete = {id, titulo}
          $("#deleteModel_confirm_modal").modal("show");
          $("#deleteModel_confirm_modal").css("z-index", "1500");
        },
        async confirm(){
          const selDoc = document.querySelector(`#idCollapsible${this.toDelete.id}`)
          if(selDoc) selDoc.click()
          await axios.delete('/api/modelos/'+this.toDelete.id)
          this.userModels = this.userModels.filter(m=>m._id!=this.toDelete.id)
          this.changePage(this.userModels)
        },
        async confirmAlteration(){
          for(let [k, m] of Object.entries(this.userModels)){
                if(m._id==this.toSave.id){
                    await axios.put('/api/modelos/alterar/'+m._id,{visibilidade: m.visibilidade, modelo: m.modelo})
                    return
                }
          }
        },
        clearDate(){
            this.dateInt = [null, new Date()]
        }
    },
    mounted() {
      if(localStorage.getItem('user')){
        this.user = JSON.parse(localStorage.getItem('user'))
        axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`
        this.getUserModels()
      }
    },
    computed: {
     getSlicedUserModels() {
      let current = this.currentPage * this.perPage;
      let start = current - this.perPage;
      let filtered = [...this.userModels]
              .filter(modelo => {
                return modelo.titulo.toLowerCase().includes(this.search.toLowerCase()) && new Date(modelo.dataCriacao) >= this.dateInt[0] && new Date(modelo.dataCriacao) <= this.dateInt[1]
              })
      this.changePage(filtered)
      return filtered.slice(start, current)
     },
     getConfirmMsg(){
       return this.confirmMsg.replace("-",this.toDelete.titulo)
     },
     getConfirmMsg2(){
        return this.confirmMsg2.replace("-",this.toSave.titulo)
     }
    }
}
</script>

<style>
a:hover,a:focus{
  text-decoration: none;
  outline: none;
}
#accordion .panel{
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 15px;
  position: relative;
}
#accordion .panel:before{
  content: "";
  display: block;
  width: 1px;
  height: 100%;
  border: 1px dashed #6e8898;
  position: absolute;
  top: 25px;
  left: 18px;
}
#accordion .panel:last-child:before{ display: none; }
#accordion .panel-heading{
  padding: 0;
  border: none;
  border-radius: 0;
  position: relative;
}
#accordion .panel-title a{
  display: block;
  padding: 10px 30px 10px 60px;
  margin: 0;
  background: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1d3557;
  border-radius: 0;
  position: relative;
}
#accordion .panel-title a:before,
#accordion .panel-title a.collapsed:before{
  content: "\f107";
  font-family: "Font Awesome 5 Free";
  font-weight: 900;
  width: 40px;
  height: 100%;
  line-height: 40px;
  background: #2196F3;
  border: 1px solid #2196F3;
  border-radius: 3px;
  font-size: 17px;
  color: #fff;
  text-align: center;
  position: absolute;
  top: 0;
  left: 0;
  transition: all 0.3s ease 0s;
}
#accordion .panel-title a.collapsed:before{
  content: "\f105";
  background: #fff;
  border: 1px solid #6e8898;
  color: #000;
}
#accordion .panel-body{
  padding: 10px 30px 10px 30px;
  margin-left: 40px;
  background: #fff;
  border-top: none;
  color: #6f6f6f;
  line-height: 28px;
  letter-spacing: 1px;
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

p{
    color:#404040;
}
.vue-codemirror{height:100%;}
.CodeMirror {
  height: 100% !important
}

.pagination > .active > a {
    z-index: 2;
    color: #fff;
    cursor: default;
    background-color: #2196F3;
    border-color: #2196F3;
}

.pagination > .active > a:hover {
    z-index: 3;
    color: #2196F3;
    background-color: #eee;
    border-color: #ddd;
}
.pagination > li > a, .pagination > li > span {
    position: relative;
    float: left;
    padding: 6px 12px;
    margin-left: -1px;
    line-height: 1.42857143;
    color: #2196F3;
    text-decoration: none;
    background-color: #fff;
    border: 1px solid #ddd;
}
.pagination > li:last-child > a, .pagination > li:last-child > span {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
}

li:last-child > a::before {
    font-family: "Font Awesome 5 Free"; 
    font-weight: 900; 
    content: "\f105";
    font-size: 17px;
    width: 40px;
    height: 100%;
    line-height: 20px;
}

li:first-child > a::before {
    font-family: "Font Awesome 5 Free"; 
    font-weight: 900; 
    content: "\f104";
    font-size: 17px;
    width: 40px;
    height: 100%;
    line-height: 20px;
}

.pagination > li:first-child > a, .pagination > li:first-child > span {
    margin-left: 0;
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
}

.pagination > .disabled > span, .pagination > .disabled > span:hover, .pagination > .disabled > span:focus, .pagination > .disabled > a, .pagination > .disabled > a:hover, .pagination > .disabled > a:focus {
    color: #777;
    cursor: not-allowed;
    background-color: #fff;
    border-color: #ddd;
}
.pagination > .active > a, .pagination > .active > span, .pagination > .active > a:hover, .pagination > .active > span:hover, .pagination > .active > a:focus, .pagination > .active > span:focus {
    z-index: 2;
    color: #fff;
    cursor: default;
    background-color: #2196F3;
    border-color: #2196F3;
}

.pagination > li > a:hover, .pagination > li > span:hover, .pagination > li > a:focus, .pagination > li > span:focus {
    z-index: 3;
    color: #2196F3;
    background-color: #eee;
    border-color: #ddd;
}

.pagination {
  display: flex;
  justify-content: center;
}

.mx-input{
  height: 100% !important;
  font-size: 1rem !important;
}
.mx-input-wrapper{
  height:100% !important
}

</style>