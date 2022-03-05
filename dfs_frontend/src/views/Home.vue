<template>
    <v-container>
      <v-row>
          <v-col sm="auto">
            <v-btn depressed dark color="indigo" @click="generate()">
              <span>Gerar</span>
              <v-icon right>mdi-reload</v-icon>
            </v-btn>
          </v-col>
          <v-col>
            <SettingsXML @saved="updateSettings"/>
          </v-col>
          <v-col class="justify-end">
            <ButtonGroup @changed="updateOutputFormat"/>
          </v-col>
      </v-row>

      <v-row class="fill-height mt-0">
        <v-flex xs12 md6>
          <Codemirror :type="'input'" :mode="input_mode" v-bind:text="input" @changed="onChangeInput"/>
        </v-flex>
        <v-flex xs12 md6>
          <Codemirror :type="'output'" :mode="output_mode" v-bind:text="output"/>
        </v-flex>
      </v-row>
    </v-container>
</template>

<script>
import SettingsXML from '@/components/Settings_XML'
import ButtonGroup from '@/components/ButtonGroup'
import Codemirror from '@/components/Codemirror'
import axios from 'axios'

export default {
  components: {
    SettingsXML,
    ButtonGroup,
    Codemirror
  },
  data() {
    return {
      input_mode: "xml",
      output_mode: "xml",
      input: "",
      output: "",
      settings: {
        UNBOUNDED: 10,
        RECURSIV: {LOWER: 0, UPPER: 3},
        OUTPUT: "XML"
      }
    }
  },
  methods: {
    onChangeInput(input) { this.input = input },
    updateSettings(new_settings) { Object.assign(this.settings, new_settings) },
    updateOutputFormat(new_format) { this.settings.OUTPUT = new_format },
    async generate() {
      let {data} = await axios.post('/api/xml_schema/', {xsd: this.input, settings: this.settings})

      let dataset = data.dataset
      this.output = typeof dataset == "string" ? dataset : "ERRO!!\n\n" + dataset.message
    }
  },
  watch: {
    settings(s) { console.log(s.OUTPUT) }
  }
}
</script>