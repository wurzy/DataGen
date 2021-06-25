<template>
  <div>
  <SaveModel :model="code"/>
    <div class="row row1">
      <div class="col-md-6 col-md-6-1">
        <div class="row row1">
          <div class="col-md-6 col-md-6-1">
            <div class="input-group" style="margin-left: -5px">
            <div class="input-group-append">
              <input class="btn btn-primary float-left" type="button" value="Gerar" @click="generate"/>
            </div>
            <div class="input-group-append">
              <input id="saveModelButton" class="btn btn-danger float-left" type="button" value="Guardar Modelo" @click="saveModel"/>
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

import axios from 'axios';
import $ from 'jquery'
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`

import { jsonToXml, jsonToStrapi } from '../util/conversions.js'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

import "codemirror/theme/dracula.css";
import 'codemirror/keymap/sublime'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/xml/xml.js'

export default {
  name: 'Home',
  components: {
    ButtonGroup,
    SaveModel,
    GrammarError
  },
  props: ["userModel"],
  data() {
      return {
        output_format: "JSON",
        colname: null,
        model: null,
        components: null,
        result: "",
        colnames: [],
        colecoes: [],
        componentes: [],
        datasets: [],
        grammar_errors: [],
        code: `<!LANGUAGE pt>
{
  colecao: [
	'repeat(3)': {
        _id: '{{objectId()}}',
        guid: '{{guid()}}',
  		indice: '{{index()}}',
  		missing(50) {
        	boleano: '{{boolean()}}'
        },
        inteiro_2args: '{{integer(30,70)}}',
        inteiro_3args: '{{formattedInteger(100,400,5,"$")}}',
        float_2args: '{{float(-180.0451, 180)}}',
        float_3args: '{{float(-180.0451, 180, 2)}}',
        float_4args: '{{formattedFloat(1000, 4000, 2, 6, "0,0.00 €€€")}}',
        posicao: '{{position()}}',
        posicao_com_limites: '{{position([0,30.5],[-50,-25.4])}}',
        telemovel: '{{pt_phone_number()}}',
        telemovel_ext: '{{pt_phone_number(true)}}',
        data: '{{date("10/01/2015")}}',
        data2: '{{date("10/01/2015", "YYYY-MM-DD")}}',
        data3: '{{date("10/05/2019","10/01/2018")}}',
        data4: '{{date("10/05/2019","10/01/2018", "MM.DD.AAAA")}}',
        aleatorio: '{{random("blue", true, false, 23, 17.56)}}',
        lorem_palavras: '{{lorem(3,"words")}}',
        lorem_frases: '{{lorem(2,"sentences")}}',
        lorem_paragrafos: '{{lorem(1,"paragraphs")}}',
	  	range: range(5),
        range_asc: range(1,15,3),
        range_desc: range(15,-50,-7),
	  	string: "boas",
	  	numero: 93,
	  	name: {
	    	first: "Hugo",
	    	last: "Cardoso"
	  	},
    	boolean: false,
	  	estudante: false,
	  	trabalhador: true,
	  	outros: null,
	  	lista_exemplo: [
	  		"string",
	  		'{{boolean()}}',
	  		{
	  			elem: 1, 
                indice: '{{integer(20,50)}}', 
                lista_nested: [1,2,3], 
                range: range(-5) 
            }
    	],
  		objeto: [
			'repeat(5)': {
  				indice_objeto: '{{index()}}'
  			}
		]
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
          generated.message = generated.message.replace("or", "ou")
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
          if (this.output_format == "JSON") {
            this.cmOutput.mode = 'text/javascript'
            this.result = JSON.stringify(generated.dataModel.data, null, 2)
          }
          if (this.output_format == "XML") {
            this.cmOutput.mode = 'text/xml'
            this.result = jsonToXml(generated.dataModel.data)
          }

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
      createAPI(){
        var promises = [];
        for (let index = 0; index < this.colecoes.length; index++) {
          let body = {
            apiName: this.colnames[index],
            model: this.colecoes[index],
            componentes: this.componentes[index],
            dataset: JSON.parse(this.datasets[index])
          }
          //console.log("apiname "+index+": ", this.colnames[index])
          //console.log("model "+index+": ", this.colecoes[index])
          //console.log("componentes "+index+": ", this.componentes[index])
          //console.log("dataset "+index+": ",  JSON.parse(this.datasets[index]))

          let bodyImp= {
              apiName: this.colnames[index],
              dataset: JSON.parse(this.datasets[index])
          }
          console.log("dataset "+index+": ", body)
          //console.log("dataset "+index+": ", bodyImp)
  
          promises.push(
            axios.post('/api/genAPI/',body)
            .then(dados => console.log("Modelo criado"))
            .catch(erro => console.log(erro))
          )
          promises.push(
            axios.post('/api/import/',bodyImp)
            .then(dados => {
              console.log("Import feito")
              window.open("/strapi/"+this.colnames[index]+"s", "_blank");    
            })
            .catch(erro => console.log(erro))
          )

        }
        Promise.all(promises).then(() => console.log("Uma API gerada!"));
       

        //console.log("modelo aquii",document.getElementById("md").getAttribute("colname"))
       

        //axios.get('http://localhost:3000/dir/'+document.getElementById('filename').value,optionAxios)
        //.then(dados => console.log("Modelo criado"))
        //.catch(erro => console.log(erro))
        document.getElementById("downloadAPIButton").disabled = false;
      },
      download(){
        if(this.result == "") {
          alert("É necessário gerar um Dataset primeiro.")
        }
        else {
          var element = document.createElement('a');
          var filename = document.getElementById('filename').value + '.json'
          element.setAttribute('href', "data:text/json;charset=utf-8," + encodeURIComponent(this.result));
          element.setAttribute('download', filename);

          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
      }
    },
    computed: {
      codemirror() {
        return this.$refs.input.codemirror
      },
      codemirror2(){
        return this.$refs.output.codemirror
      }
    },
    mounted() {
      if(this.$props.userModel) this.code = this.$props.userModel
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