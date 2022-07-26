<template>
  <v-container class="height-wrap">
    <!-- modals -->
    <Modal
      title="Erro"
      :visible="error"
      @close="error=false"
    >
      {{errorMsg}}
    </Modal>

    <Modal
      title="Gerar dataset"
      options
      :visible="choose_schema"
      @close="choose_schema=false"
      @confirm="generate"
    >
      Deseja gerar o dataset a partir de que schema?
      <v-select class="select-schema"
        :key="choose_schema"
        v-model="main_schema"
        :items="input_mode=='xml' ? xml_schemas[0].elements : json_schemas"
        item-text="label"
        item-value="key"
        label="Selecionar"
        outlined
        single-line
        return-object
        style="padding-top: 10px;"
      ></v-select>
    </Modal>

    <Modal
      title="Definições do processo de geração"
      options
      settings
      more_width
      :valid_settings="valid_settings"
      :visible="settings"
      @close="closeSettings"
      @confirm="confirmSettings"
    >
      <SettingsXML v-if="input_mode=='xml'" ref="settingsXML" :settings="xml_settings" :result="result_settings" @updateValid="updateSettingsValidity" @saved="updateSettings"/>
      <SettingsJSON v-else ref="settingsXML" :settings="json_settings" :result="result_settings" @updateValid="updateSettingsValidity" @saved="updateSettings"/>
    </Modal>

    <Modal
      title="Estruturação de uma schema complexa"
      more_width
      :visible="tips"
      @close="tips=false"
    >
      <h3>Identificação de schemas (<a href="https://json-schema.org/understanding-json-schema/structuring.html#id" target="_blank">$id</a>)</h3>
      <ul>
        <li><b>URI absoluto:</b> <code>https://datagen.di.uminho.pt/schemas/<span style="color:red">{nome_schema}</span></code></li>
        <li><b>URI relativo:</b> <code>/schemas/<span style="color:red">{nome_schema}</span></code></li>
      </ul>
      <br>
      <h3>Referenciação de schemas (<a href="https://json-schema.org/understanding-json-schema/structuring.html#ref" target="_blank">$ref</a>)</h3>
      <ul>
        <li>
          <b>Schema com $id:</b> 
          <ul>
            <li><b>URI absoluto:</b> <code>https://datagen.di.uminho.pt/schemas/<span style="color:red">{id_schema}</span></code></li>
            <li><b>URI relativo:</b> <code>/schemas/<span style="color:red">{id_schema}</span></code></li>
          </ul>
        </li>
        <li>
          <b><a href="https://json-schema.org/understanding-json-schema/structuring.html#json-pointer" target="_blank">Apontador JSON</a> ou âncora (<a href="https://json-schema.org/understanding-json-schema/structuring.html#anchor" target="_blank">$anchor</a>):</b> 
          <ul>
            <li><b>URI absoluto:</b> <code>https://datagen.di.uminho.pt/schemas/<span style="color:red">{id_schema}</span>#<span style="color:red">{apontador/nome_âncora}</span></code></li>
            <li><b>URI relativo:</b> 
              <ul>
                <li><u>Schema local</u>: <code>#<span style="color:red">{apontador/nome_âncora}</span></code></li>
                <li><u>Qualquer schema</u>: <code>/schemas/<span style="color:red">{id_schema}</span>#<span style="color:red">{apontador/nome_âncora}</span></code></li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </Modal>

    <Modal
      :key="created_datasets"
      title="Modelo intermédio gerado na DSL do DataGen"
      more_width
      :model="model"
      :visible="show_model"
      @close="show_model=false"
      @save_model="save_model=true"
    >
      <Codemirror :key="dataset_tab" type="output" mode="javascript" :text="model" :modal="true" @changed="onChangeModel"/>
    </Modal>
    
    <Modal
      title="Guardar Modelo"
      options
      :visible="save_model"
      @close="save_model=false"
      @confirm="saveModel"
    >
      <v-form ref="form" v-model="valid" lazy-validation class="px-3">
        <v-text-field v-model="title" :rules="[required]" label='Título'/>
        <v-textarea v-model="description" :rules="[required]" auto-grow label='Descrição' />
        <v-switch v-model="visibility">
          <template v-slot:label>
            <span v-if="visibility"><v-icon>mdi-lock-open</v-icon> Público</span>
            <span v-else><v-icon>mdi-lock</v-icon> Privado</span>
          </template>
        </v-switch>
      </v-form>
    </Modal>

    <v-row>
      <v-col xs="6" sm="6" md="3">
        <v-btn
          style="margin-right: 25px;"
          depressed
          :color='`var(--${input_mode}-primary)`'
          :disabled="loading"
          class="white--text"
          @click="!loading ? (input_mode=='xml' ? askXmlMainSchema() : askJsonMainSchema()) : true"
        >
          Gerar<v-icon right>mdi-reload</v-icon>
        </v-btn>

        <v-btn
          depressed
          fab
          small
          style="margin-right: 10px;"
          color="blue-grey lighten-4"
          :disabled="loading"
          @click="openSettings"
        >
          <v-icon>mdi-cog</v-icon>
        </v-btn>

        <v-btn
          v-if="input_mode=='javascript'"
          depressed 
          fab 
          small 
          color="var(--json-primary)" 
          :disabled="loading" 
          @click="tips=true"
        >
          <v-icon color="white">mdi-exclamation-thick</v-icon>
        </v-btn>
      </v-col>

      <v-col xs="6" sm="6" md="3" align="end">
        <v-btn
          v-if="!no_datasets && !grammar_errors.length"
          depressed
          :color='`var(--${input_mode}-primary)`'
          :disabled="loading"
          class="white--text"
          @click="show_model=true"
        >
          Modelo intermédio
        </v-btn>
      </v-col>

      <v-col xs="6" sm="6" md="3">
        <div class="d-flex">
          <ButtonGroup :format="output_format" :loading="loading" @changed="updateOutputFormat" style="margin-right: 20px;"/>
          <loading-progress v-if="loading"
            :key="input_mode"
            style="width: 48px; height: 48px;"
            indeterminate="indeterminate"
            size="50"
            rotate
            fillDuration="5"
            rotationDuration="2.5"
            :class="input_mode=='xml' ? 'xml-stroke' : 'json-stroke'"
          />
        </div>
      </v-col>

      <v-col xs="6" sm="6" md="3">
        <div v-if="!no_datasets && !grammar_errors.length" class="d-flex justify-end">
          <input class="filename-input" v-model="filename"/>
          <v-btn depressed :color='`var(--${input_mode}-primary)`' :disabled="loading" class="white--text" @click="download">
            Download<v-icon right>mdi-download</v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row class="height-wrap2 mt-0">
      <!-- consola input -->
      <v-flex xs12 md6>
        <v-container>
          <InputTabs
            :key="input_mode"
            :input_mode="input_mode" 
            :loading="loading"
            :hover="input_mode=='xml' ? xml_tab.key : json_tab.key" 
            :tabs="input_mode=='xml' ? xml_tabs : json_tabs"
            @updateContent="updateContent" 
            @updateTabs="updateTabs" 
            @hover="updateMain"
            @errorUpload="errUpload"
          />
        </v-container>
      </v-flex>

      <!-- CONSOLA OUTPUT -->
      <v-flex xs12 md6>
        <v-container>
          <GrammarError v-if="grammar_errors.length>0" :errors="grammar_errors"/>
            
          <div class="fill-height">
            <div v-if="no_datasets" class="no-tabs" :style="`background-color: var(--${input_mode}-primary);`"/> 
            <vue-tabs-chrome v-else class="tabs" ref="tab" v-model="dataset_tab" :tabs="dataset_tabs" :on-close="closeDataset" :style="`background-color: var(--${input_mode}-primary);`"/>
            <Codemirror :key="output_key" type="output" :mode="tab_format" :text="dataset" @changed="onChangeDataset"/>
          </div>
        </v-container>
      </v-flex>
    </v-row>
  </v-container>
</template>

<script>
import _ from 'lodash'
import axios from 'axios'
import VueTabsChrome from "vue-tabs-chrome"
import SettingsJSON from '@/components/Settings_JSON'
import SettingsXML from '@/components/Settings_XML'
import ButtonGroup from '@/components/ButtonGroup'
import Codemirror from '@/components/Codemirror'
import GrammarError from '@/components/GrammarError.vue'
import Modal from '@/components/Modal'
import InputTabs from '@/components/Input_Tabs'
import aux from '@/utils/js_aux'

export default {
  components: {
    VueTabsChrome,
    SettingsJSON,
    SettingsXML,
    ButtonGroup,
    Codemirror,
    Modal,
    InputTabs,
    GrammarError
  },
  data() {
    return {
      // input e output
      input_mode: "xml",
      output_mode: "xml",
      output_format: "XML",
      tab_format: "xml",

      // from XML schemas
      xml_tabs: [{ label: "Schema", key: "schema_1", content: "", closable: false }],
      xml_schemas: [{ label: "Schema", key: "schema_1", elements: [] }],
      xml_tab: {label: "Schema", key: "schema_1"},
      xml_element: {},
      xml_schema_changes_since_last_gen: false,
      xml_settings: {
        recursion: {lower: 0, upper: 3},
        unbounded: 10,
        prob_default: 60,
        prob_nil: 30,
        prob_noAll: 30,
        datagen_language: "pt"
      },
      
      // from JSON schemas
      json_tabs: [{ label: "Schema 1", key: "schema_1", content: "", closable: false }],
      json_schemas: [{ label: "Schema 1", key: "schema_1" }],
      json_tab: {label: "Schema 1", key: "schema_1"},
      json_settings: {
        recursion: {lower: 0, upper: 3},
        prob_if: 50,
        prob_patternProperty: 80,
        random_props: false,
        extend_objectProperties: "OR",
        extend_prefixItems: "OR",
        extend_schemaProperties: "OR",
        datagen_language: "pt"
      },

      // datasets produzidos
      dataset_tabs: [{ label: "", key: "dataset_1", dataset: "", model: "", filename: "", format: "" }],
      dataset_tab: "dataset_1",
      created_datasets: 0,

      // modal de settings
      settings: false,
      valid_settings: true,
      result_settings: 0,

      // modal do modelo intermédio
      show_model: false,
      save_model: false,
      title: "",
      description: "",
      visibility: false,
      valid: true,
      required: v => !!v || "Valor obrigatório.",

      tips: false,
      loading: false,
      send_req: false,

      get token() { return localStorage.getItem("token") },
      choose_schema: false,
      error: false,
      grammar_errors: [],
      errorMsg: ""
    }
  },
  created() { localStorage.setItem("no_input", 1) },
  mounted() {
    window.addEventListener('changed-input_mode', (event) => {
      this.input_mode = event.detail.storage.mode
      this.output_mode = event.detail.storage.mode
      this.output_format = event.detail.storage.format
      this.tab_format = this.output_mode
    })

    window.addEventListener('reset_schemas', () => {
      this.json_tabs = [{ label: "Schema 1", key: "schema_1", content: "", closable: false }]
      this.json_schemas = [{ label: "Schema 1", key: "schema_1" }]
      this.json_tab = {label: "Schema 1", key: "schema_1"}

      this.xml_tabs = [{ label: "Schema", key: "schema_1", content: "", closable: false }]
      this.xml_schemas = [{ label: "Schema", key: "schema_1" }]
      this.xml_tab = {label: "Schema", key: "schema_1"}

      this.xml_schemas[0].elements = []
      this.xml_element = {}

      this.dataset_tabs = [{ label: "", key: "dataset_1", dataset: "", model: "", filename: "", format: "" }]
      this.dataset_tab = "dataset_1"
      this.created_datasets = 0

      this.grammar_errors = []
    })
  },
  computed: {
    main_schema: {
      get() { return this.input_mode == 'xml' ? this.xml_element : this.json_tab },
      set(value) {
        if (this.input_mode == "xml") this.xml_element = value
        else this.json_tab = value
      }
    },
    output_key() { return this.tab_format + "_" + this.dataset_tab },
    dataset() { return this.dataset_tabs.find(t => t.key == this.dataset_tab).dataset },
    filename() { return this.dataset_tabs.find(t => t.key == this.dataset_tab).filename },
    model() { return this.dataset_tabs.find(t => t.key == this.dataset_tab).model },
    no_datasets() { return this.dataset_tabs.length == 1 && !this.dataset_tabs[0].model.length },
    schemas() { return this.input_mode == "xml" ? this.xml_schemas : this.json_schemas }
  },
  watch: {
    dataset_tab() { this.tab_format = this.dataset_tabs.find(t => t.key == this.dataset_tab).format }
  },
  methods: {
    openSettings() { this.result_settings = 0; this.settings = true },
    closeSettings() { this.result_settings = -1; this.settings = false },
    confirmSettings() { this.result_settings = 1; this.settings = false },
    updateSettingsValidity(input_mode, new_valid) { if (input_mode == this.input_mode) this.valid_settings = new_valid },
    updateSettings(new_settings) {
      let settings = this.input_mode == "xml" ? this.xml_settings : this.json_settings
      Object.assign(settings, new_settings)
    },
    updateOutputFormat(new_format) {
      this.output_format = new_format
      this.output_mode = new_format == "XML" ? "xml" : "javascript"
    },
    errUpload() {
      this.errorMsg = `O ficheiro que escolheu não corresponde a uma schema ${this.input_mode=="xml"?"XML":"JSON"}. A extensão do ficheiro deve ser ${this.input_mode=="xml"?".xsd":".json"}!`
      this.error = true
    },
    updateMain(key) {
      let main_schema = this.schemas.find(s => s.key == key)
      if (this.input_mode == "xml") this.xml_tab = main_schema
      else this.json_tab = main_schema
    },
    updateContent(index, content) {
      let tabs = this.input_mode == "xml" ? this.xml_tabs : this.json_tabs
      let tab = this.input_mode == "xml" ? this.xml_tab : this.json_tab
      
      let new_label
      if (this.input_mode == "javascript") new_label = aux.searchJsonSchemaId(content, tabs[index].key)
      else {
        new_label = "Schema"
        this.xml_schema_changes_since_last_gen = true
      }

      // dar update ao label da schema para o seu id, se tiver um
      // ou para o label original da schema (Schema nr), se o user tiver apagado o id
      if (new_label != tabs[index].label) {
        tabs[index].label = new_label
        this.schemas[index].label = new_label
        if (tab.key == tabs[index].key) tab.label = new_label
      }
      tabs[index].content = content

      // dar update à flag de input existente no localStorage
      let no_input = tabs.every(t => !t.content.length) ? 1 : 0
      let lsVar = localStorage.getItem("no_input")
      if (lsVar != no_input) localStorage.setItem("no_input", no_input)
    },
    updateTabs(new_tabs, index, upload) {
      let tabs = this.input_mode == "xml" ? this.xml_tabs : this.json_tabs
      tabs = new_tabs

      // se tiver 2+ tabs, qualquer uma pode ser fechada; se só tiver 1, não pode
      if (tabs.length == 1) tabs[0].closable = false
      if (tabs.length > 1) tabs[0].closable = true
      
      let schemas = tabs.map(t => { return {label: t.label, key: t.key} })
      if (this.input_mode == "xml") this.xml_schemas = schemas
      else this.json_schemas = schemas

      if (upload) this.updateContent(index, tabs[index].content)
    },
    askJsonMainSchema() {
      let tabs = this.input_mode == "xml" ? this.xml_tabs : this.json_tabs

      if (this.input_mode == "xml") {
        if (tabs.length == 1) this.generate()
        else this.choose_schema = true
      }
      else {
        let ids = aux.getAllIds(tabs.map(t => t.content))

        if (ids.length == new Set(ids).size) {
          if (tabs.length == 1) this.generate()
          else this.choose_schema = true
        }
        else {
          let next_ids = _.clone(ids)

          for (let i = 0; i < ids.length; i++) {
            next_ids.shift()

            if (next_ids.includes(ids[i])) {
              this.errorMsg = `Todas as schemas e subschemas devem ter ids únicos! Existe mais do que uma schema com o id '${ids[i]}'.`
              this.error = true
              break
            }
          }
        }
      }
    },
    async askXmlMainSchema() {
      let {data} = await axios.post('/api/xml_schema/elements', {schema: this.xml_tabs[0].content})
      
      if ("message" in data) this.grammar_errors = [aux.translateMsg(data)]
      else if ("elements" in data) {
        if (!data.elements.length) {
          let lines = this.xml_tabs[0].content.split("\n")

          this.grammar_errors = [{
            message: "A schema não tem nenhum <b>&#60;element&#62;</b> global para gerar um dataset!",
            location: {
              start: {line: 1, column: 1},
              end: {line: lines.length, column: lines[lines.length-1].length}
            }
          }]
        }
        else {
          this.xml_schemas[0].elements = []
          if (this.xml_schema_changes_since_last_gen) this.xml_element = {}

          if (data.elements.length == 1) {
            this.xml_element = {label: data.elements[0], key: "elem_1"}
            this.generate()
          }
          else {
            data.elements.map((e,i) => {
              let elem = {label: e, key: "elem_"+(i+1)}
              this.xml_schemas[0].elements.push(elem)
              if (!("key" in this.xml_element) && !i) this.xml_element = elem
            })
            this.choose_schema = true
          }
        }
      }
    },
    async generate() {
      this.send_req = true
      this.choose_schema = false
      let result, filename = ""
      
      let settings = this.input_mode == "xml" ? this.xml_settings : this.json_settings
      settings.output = this.output_format.toLowerCase()
      setTimeout(() => {
        if (this.send_req) {
          this.loading = true
          window.dispatchEvent(new CustomEvent("loading", {detail: { storage: {loading: true} }}))
        }
      }, 3000)

      if (this.input_mode == "xml") {
        filename = this.xml_element.label
        result = await this.sendGenRequest("xml", {schema: this.xml_tabs[0].content, element: filename, settings})
      }
      else {
        let other_schemas = []
        if (this.json_tabs.length > 1) {
          let tabs = aux.removeRepeatedSchemas(_.cloneDeep(this.json_tabs), this.json_tab.key)
          other_schemas = tabs.filter(s => s.key != this.json_tab.key && s.content.length > 0)
        }
        
        let main_schema = this.json_tabs.find(t => t.key == this.json_tab.key)
        filename = main_schema.label
        result = await this.sendGenRequest("json", {schemas: [main_schema, ...other_schemas], settings})
      }
      
      if (result !== undefined) {
        if ("message" in result.data) {
          if ("location" in result.data) {
            this.grammar_errors = [aux.translateMsg(result.data)]
            if ("schema_key" in result.data) this.updateMain(result.data.schema_key)
          }
          else { // erro ao resolver as refs de JSON Schema
            this.errorMsg = result.data.message
            this.error = true
          }
        }
        else {
          this.grammar_errors = []
          this.tab_format = this.output_mode
          this.newDataset(result.data, filename)
        }
      }
      
      this.loading = false
      this.send_req = false
      if (this.input_mode == "xml") this.xml_schema_changes_since_last_gen = false
      window.dispatchEvent(new CustomEvent("loading", {detail: { storage: {loading: false} }}))
    },
    async sendGenRequest(type, body) {
      try {
        return await axios.post(`/api/${type}_schema/`, body, {timeout: 30000})
      } 
      catch (err) {
        this.errorMsg = "A operação de geração do dataset excedeu o tempo limite!"
        this.error = true
      }
    },
    download() {
      if (!this.dataset.length) {
        this.errorMsg = "É necessário gerar um dataset primeiro!"
        this.error = true
      }
      else {
        let element = document.createElement('a')
        element.style.display = 'none'

        element.setAttribute('href', `data:text/plain;charset=utf-8,` + encodeURIComponent(this.dataset))
        element.setAttribute('download', this.filename + "." + (this.tab_format == "xml" ? "xml" : "json"))

        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
      }
    },
    async saveModel() {
      if (this.token === null) {
        this.errorMsg = "Precisa de iniciar sessão para efetuar esta operação!"
        this.error = true
      }
      else {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        await axios.post('/api/modelos/adicionar', {
          user: JSON.parse(localStorage.getItem('user'))._id,
          modelo: this.model,
          titulo: this.title,
          descricao: this.description,
          visibilidade: this.visibility,
          dataCriacao: new Date()
        })
        
        this.title = ""
        this.description = ""
        this.switch = false
        this.valid = true
        this.save_model = false
        this.$buefy.toast.open("Modelo guardado!")
      }
    },
    
    onChangeModel(content) { this.dataset_tabs.find(t => t.key == this.dataset_tab).model = content },
    onChangeDataset(content) { this.dataset_tabs.find(t => t.key == this.dataset_tab).dataset = content },
    newDataset(result, filename) {
      let index = this.dataset_tabs.findIndex(t => t.key == this.dataset_tab)
      let tab = this.dataset_tabs[index]
      let key = "dataset_" + ++this.created_datasets

      if (this.no_datasets || !tab.dataset.length) {
        tab.label = tab.filename = filename
        tab.dataset = result.dataset
        tab.model = result.model
        tab.format = this.output_mode
      }
      else {
        this.$refs.tab.addTab({label: filename, key, ...result, filename, format: this.output_mode})
        this.dataset_tab = key
      }
    },
    closeDataset() {
      if (this.loading) return false
      else if (this.dataset_tabs.length == 1) {
        this.dataset_tabs[0].dataset = ""
        this.dataset_tabs[0].model = ""
        this.dataset_tabs[0].filename = ""
        this.dataset_tabs[0].format = ""
        return false
      }
      return true
    },
  }
}
</script>

<style>
@import '../utils/colors.css';

.height-wrap {
  height: calc( 100vh - 64px ) !important;
  max-width: 100%;
  overflow: hidden !important;
}

.height-wrap2 {
  height: calc( 100vh - 140px ) !important;
}

.v-btn {
  height: 48px !important;
}

.v-btn--fab {
  height: 48px !important;
  width: 48px !important;
}

.v-btn--fab:focus::before {
  opacity: 0 !important;
}

.parameters {
  display: flex;
  flex-direction: column;
  align-items: center;
  width:auto;
  height:auto;
}

.select-schema {
  display: flex;
  padding-top: 20px;
}

.filename-input {
  border: 1px solid rgba(60, 60, 60, .29);
  border-radius: 4px;
  padding: 0.2em 0.6em;
  margin-right: 5px;
  margin-left: 20px;
  background: transparent;
  transition: background-color .5s;
}

.xml-stroke * .progress {
  stroke: var(--xml-primary) !important;
}

.json-stroke * .progress {
  stroke: var(--json-primary) !important;
}

.xml-stroke * .background {
  stroke: #ddd !important;
}

.json-stroke * .background {
  stroke: #ddd !important;
}

svg {
  width: 48px;
  height: 48px;
}

.vue-tabs-chrome {
  padding-top: 5px;
}

.tabs-item {
  color: white;
}

.tabs-item:hover {
  color: black;
}

.active {
  color: black !important;
}

.no-tabs {
  height: 39px;
  margin-bottom: 4px;
}
</style>