<template>
  <div>
  <SaveModel :model="code"/>
  <Error msg="Ocorreu um erro na geração do API possivelmente devido a um erro no modelo ou a algo inesperado que aconteceu no Strapi." id="error_api_modal"/>
  <Error msg="O Strapi não aceita nomes com letras maiúsculas para atributos compostos! Se pretende gerar uma API para este dataset, por favor escreva os nomes desses atributos em letras minúsculas." id="error_api2_modal"/>
  <Error :msg="csv_err" id="error_csv_modal"/>
  <Success type="generate_api" msg="API gerada com sucesso! Clique no botão 'Continuar' para abrir num novo separador os links da API. NOTA: Pode demorar um pouco a aparecer a API completa, se for o caso recarregue essa página após alguns segundos." id="success_api_modal" v-on:api_ok="apiOk"/>
    <div class="row row1">
      <div class="col-md-6 col-md-6-1">
        <div class="row row1">
          <div class="col-md-6 col-md-6-1">
            <div class="input-group" style="margin-left: -5px">
            <div class="input-group-append">
              <input class="btn btn-primary float-left" type="button" value="Gerar" @click="generate"/>
            </div>
            <div class="input-group-append">
              <input v-if="isLoggedIn" id="saveModelButton" class="btn btn-danger float-left" type="button" value="Guardar Modelo" @click="saveModel"/>
            </div>
            </div>
          </div>
          <div class="col-md-6 col-md-6-1">
            <ButtonGroup @toggleConversionType="toggleConversionType"/>
          </div>
        </div>
      </div>
      <div class="col-md-6 col-md-6-1">
        <div class="input-group">
          <div class="input-group-prepend ">
            <span class="input-group-text" id="basic-addon1">Nome:</span>
          </div>
          <input type="text" class="form-control" id="filename" value="dataset">
          <div class="input-group-append">
            <button id="defaultDownloadButton" class="btn btn-primary" disabled type="button" @click="download">Download</button>
          </div>
          <div class="input-group-append">
            <button id="generateAPIButton" class="btn btn-success" disabled type="button" @click="createAPI">Gerar API</button>
          </div>
          <div class="input-group-append">
            <button id="downloadAPIButton" class="btn btn-danger" disabled type="button" @click="downloadAPI">Download API</button>
          </div>
        </div>
      </div>
    </div>
    <div class="row row1">
      <div class="col-md-6 col-md-6-1 stretcher">
        <codemirror 
                ref="input"
                :value= "code"
                :options="cmInput"
                @input="onCmCodeChange"
        />
      </div>
      <div class="col-md-6 col-md-6-1 col-md-offset-2 stretcher">
        <GrammarError v-if="grammar_errors.length>0" :errors="grammar_errors" id="grammar_error"/>
        <codemirror v-else
                ref="output"
                :value="result"
                :options="cmOutput"
        />
      </div>
    </div>
  </div>
  
</template>

<script>
import ButtonGroup from '../components/ButtonGroup'
import SaveModel from '../components/SaveModel.vue';
import GrammarError from '../components/GrammarError.vue'
import Error from '../components/Error.vue'
import Success from '../components/Success.vue'
import JSZip from 'jszip'
import { saveAs } from 'file-saver';

import axios from 'axios';
import $ from 'jquery'
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`

import { cleanJson, jsonToXml, jsonToStrapi, jsonToCsv } from '../util/conversions.js'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

import "codemirror/theme/dracula.css";
import 'codemirror/keymap/sublime'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/mode/q/q.js'

export default {
  name: 'Home',
  components: {
    ButtonGroup,
    SaveModel,
    GrammarError,
    Error,
    Success
  },
  props: ["userModel"],
  data() {
      return {
        output_format: "JSON",
        cur_output: "JSON",
        colname: null,
        model: null,
        components: null,
        result: "",
        colnames: [],
        colecoes: [],
        componentes: [],
        datasets: [],
        grammar_errors: [],
        generated_apis: [],
        csv_err: '',
        code: `<!LANGUAGE pt>
{
  perfil: [
	'repeat(3)': {
        nome: '{{fullName()}}',
    	idade: '{{integer(15,60)}}',
  		or() {
          	BI: '{{integerOfSize(8)}}-{{integer(0,9)}}',
          	CC: '{{integerOfSize(8)}}-{{integer(0,9)}}-{{letter("uppercase")}}{{letter("uppercase")}}{{integer(0,9)}}'
        },
    	having(70) {
  			descrição: '{{lorem("sentences", 1)}}'
		},
        nr_livros: '{{integer(1,10)}}',
        livros: [ 'repeat(this.nr_livros)': {
        	titulo: '{{lorem("words",1)}}',
            suporte: '{{random("Físico","Digital")}}',
            rating: '{{integer(1,5)}}'
        } ],
        livro_favorito(gen) {
          var titulos = this.livros.map(x => x.titulo)
          return gen.random(...titulos)
      	}
    }
  ]
}`,
        cmInput: {
          tabSize: 4,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          styleSelectedText: true,
          keyMap: "sublime",
          mode: 'text/javascript',
          matchBrackets: true,
          showCursorWhenSelecting: true,
          theme: "dracula",
          extraKeys: { "Ctrl": "autocomplete" },
          hintOptions:{
            completeSingle: false
          }
        },
        cmOutput: {
          tabSize: 4,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          styleSelectedText: true,
          keyMap: "sublime",
          mode: 'text/javascript',
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
      onCmCodeChange(newcode){
        this.code = newcode
      },
      toggleConversionType(arg){
        this.output_format = arg
      },
      async generate(){
        this.colnames=[]
        this.colecoes=[]
        this.componentes=[]
        this.datasets=[]
        
        //generated é um objeto em que o valor de cada prop é {dataset, model}
        var data = await axios.post('/api/datagen/',this.code, {headers: {'Content-Type': 'text/plain'}})
        var generated = data.data

        //deu erro que crashou a gramática
        if ("message" in generated) {
          generated.message = generated.message.replace("Expected", "Era esperado")
          generated.message = generated.message.replace(", or", " ou")
          generated.message = generated.message.replace("but", "mas foi encontrado")
          generated.message = generated.message.replace(" found", "")

          let error_msg = [{msg: generated.message, location: generated.location}]
          this.grammar_errors = error_msg
        }
        //deu 1+ erros hard-coded na gramática
        else if (generated.errors.length) {
        
          let error_msg = []
          generated.errors.forEach(error => {
            error_msg.push({msg: error.message, location: error.location})
          })
          this.grammar_errors = error_msg
          
        }
        else { 
          this.grammar_errors = []
          let ok = true

          if (this.output_format == "JSON") {
            this.cmOutput.mode = 'text/javascript'
            this.result = JSON.stringify(cleanJson(generated.dataModel.data), null, 2)
          }
          if (this.output_format == "XML") {
            this.cmOutput.mode = 'text/xml'
            this.result = jsonToXml(generated.dataModel.data)
          }
          if (this.output_format == "CSV") {
            ok = false
            this.cmOutput.mode = 'text/x-q'
            let result = jsonToCsv(generated.dataModel, generated.collection_ids)

            if (typeof result != "string"){
              this.csv_err = result.error
              document.getElementById("generateAPIButton").disabled = true;
              $("#error_csv_modal").modal("show");
              $("#error_csv_modal").css("z-index", "1500");
            } 
            else { this.result = result; ok = true }
          }
          
          if (ok) {
            var mkeys = Object.keys(generated.dataModel.model)
            var ckeys = Object.keys(generated.components)
            var dkeys = Object.keys(generated.dataModel.data)

            var index
            for (index = 0; index < mkeys.length; index++) {
              let mkey = mkeys[index]
              let ckey = ckeys[index]
              let dkey = dkeys[index]
              this.colnames.push(mkey)
              this.colecoes.push(generated.dataModel.model[`${mkey}`]) 
              this.componentes.push(generated.components[`${ckey}`]) 
              let dat = jsonToStrapi(generated.dataModel.data[`${dkey}`])

              this.datasets.push(JSON.stringify(dat, null, 2))
            }
            this.colname = mkeys[0]
            this.model = generated.dataModel.model
            this.components = generated.components

            //document.getElementById("saveModelButton").disabled = false;
            document.getElementById("defaultDownloadButton").disabled = false;
            document.getElementById("generateAPIButton").disabled = false;
            this.cur_output = this.output_format 
          }
        }
      },
      downloadAPI(){
        var cname = this.colname
        console.log("collection name:"+cname)
        axios({
          url: '/api/download/'+cname, //your url
          method: 'GET',
          responseType: 'blob', // important
        }).then((response) => {
           const url = window.URL.createObjectURL(new Blob([response.data]));
           const link = document.createElement('a');
           link.href = url;
           link.setAttribute('download', cname + '.zip'); //or any other extension
           document.body.appendChild(link);
           link.click();
        });
        //var id = "colecao_c400bb89-41a0-4a94-80de-a0f29100afc9"
        axios.get('/api/download/'+cname)
          .then(dados => console.log("Zip criado"))
          .catch(erro => console.log(erro))
      },
      async saveModel(){
        $("#savemodels_modal").modal("show");
        $("#savemodels_modal").css("z-index", "1500");
      },
      apiOk(){
        this.generated_apis.forEach(api => {
            window.open("/strapi/"+api+"s", "_blank")
        })
      },
      checkModelKeys() {
        for (let collection in this.model) {
          for (let key in this.model[collection].attributes) {
            if ("component" in this.model[collection].attributes[key] && /[A-Z]/.test(key)) return false
          }
        }
        return true
      },
      createAPI() {        
        if (!this.checkModelKeys()){
            $("#error_api2_modal").modal("show");
            $("#error_api2_modal").css("z-index", "1500");
        }
        else {
          var promises = [];
          var ok = true
          for (let index = 0; index < this.colecoes.length; index++) {
            let body = {
              apiName: this.colnames[index],
              model: this.colecoes[index],
              componentes: this.componentes[index],
              dataset: JSON.parse(this.datasets[index])
            }

            let bodyImp= {
                apiName: this.colnames[index],
                dataset: JSON.parse(this.datasets[index])
            }
            console.log("dataset "+index+": ", body)
            //console.log("dataset "+index+": ", bodyImp)
    
            promises.push(
              axios.post('/api/genAPI/',body)
              .then(dados => console.log("Modelo criado"))
              .catch(erro => {
                console.log(erro)
                ok = false
              })
            )
            promises.push(
              axios.post('/api/import/',bodyImp)
              .then(dados => {
                console.log("Import feito")
                let coln_axios = this.colnames[index]
                this.generated_apis.push(coln_axios)
              })
              .catch(erro =>{
                console.log(erro)
                ok = false
              })
            )

          }
          Promise.all(promises).then(() => {
            console.log("Uma API gerada!")
          });
          if(ok){
            document.getElementById("downloadAPIButton").disabled = false;
            document.getElementById("generateAPIButton").disabled = true;
            $("#success_api_modal").modal("show");
            $("#success_api_modal").css("z-index", "1500");
          }
          else{
            $("#error_api_modal").modal("show");
            $("#error_api_modal").css("z-index", "1500");
          }
        }
      },
      async download(){
        if(this.result == "") {
          alert("É necessário gerar um Dataset primeiro.")
        }
        else {
          let docdata = this.result
          var element = document.createElement('a');
          var filename = document.getElementById('filename').value
          var typedoc
          let zipped = false
          if (this.cur_output == "XML") {
            filename += ".xml"
            typedoc = "data:text/xml;charset=utf-8," 
          }
          else if (this.cur_output == "JSON"){
            filename += ".json"
            typedoc = "data:text/json;charset=utf-8," 
          }
          else{ 
            let resultCSV = this.result.split('\n\n')
            if(resultCSV.length == 1){
              filename += '.csv'
              typedoc = "data:text/csv;charset=utf-8," 
              docdata = resultCSV[0]
            }
            else {
              filename += ".zip"
              const zip = new JSZip()
              resultCSV.forEach( csv => zip.file(`${csv.split('\n')[0]}.csv`, csv) )
              zipped = true
              docdata = await zip.generateAsync({
                type: "blob",
              })
              saveAs(docdata,filename)
            } 
          }
          if(!zipped){
            element.setAttribute('href', typedoc + encodeURIComponent(docdata));
            element.setAttribute('download', filename);
            element.style.display = 'none';
   
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }
        }
      }
    },
    computed: {
      codemirror() {
        return this.$refs.input.codemirror
      },
      codemirror2(){
        return this.$refs.output.codemirror
      },
      isLoggedIn(){
        return localStorage.getItem('token') ? true : false
      }
    },
    mounted() {
      if (this.$props.userModel) this.code = this.$props.userModel
      this.codemirror.setSize("100%", "100%")
      this.codemirror2.setSize("100%", "100%")
    }
  }
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.row1 {margin-left: -8px !important; max-width: 100% !important; margin-bottom: 1px !important;}
.col-md-6-1 {padding-right: 0px !important;}
.stretcher {padding-right: 0px !important; height: 89vh !important;}
.vue-codemirror{height:100%;}
.CodeMirror pre.CodeMirror-line, .CodeMirror pre.CodeMirror-line-like {
  font-size: smaller !important; 
}
.CodeMirror-linenumber{
  font-size: smaller !important;
}

#grammar_error{
  height: 89vh !important;
  margin: 0;
  overflow:scroll;
}

</style>