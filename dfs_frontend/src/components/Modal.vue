<template>
    <v-dialog :value="visible" 
      @input="$emit('update:visible',false)" 
      @keydown.esc="close"
      @click:outside="close"
      :width="more_width ? '1000px' : '600px'"
    >

      <v-card style="z-index:2;">
        <v-card-title class="text-h5 grey lighten-2">
          {{$props.title ? $props.title : "Mensagem"}}
          <v-spacer></v-spacer>

          <div v-if="datagen" class="btns">
            <v-tooltip top max-width="420px">
              <template v-slot:activator="{ on }">
                <v-btn fab depressed color="grey lighten-2" v-on="on" @click="redirect" @mouseleave="$event.target.blur()">
                  <v-icon>mdi-arrow-top-right-bold-box-outline</v-icon>
                </v-btn>
              </template>
              <span>Visitar</span>
            </v-tooltip>
          </div>

          <div v-if="model!==undefined" class="btns">
            <v-tooltip top max-width="420px">
              <template v-slot:activator="{ on }">
                <v-btn fab depressed color="grey lighten-2" v-on="on" @click="copy" @mouseleave="$event.target.blur()">
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </template>
              <span>Copiar para a área de tranferência</span>
            </v-tooltip>

            <v-tooltip top max-width="420px">
              <template v-slot:activator="{ on }">
                <v-btn fab depressed color="grey lighten-2" v-on="on" @click="download" @mouseleave="$event.target.blur()">
                  <v-icon>mdi-download</v-icon>
                </v-btn>
              </template>
              <span>Download</span>
            </v-tooltip>
            
            <v-tooltip v-if="session" top max-width="420px">
              <template v-slot:activator="{ on }">
                <v-btn fab depressed color="grey lighten-2" v-on="on" @click="$emit('save_model')" @mouseleave="$event.target.blur()">
                  <v-icon>mdi-content-save</v-icon>
                </v-btn>
              </template>
              <span>Guardar modelo</span>
            </v-tooltip>
          </div>
        </v-card-title>

        <div :class="(api || model!==undefined) ? '' : 'message'">
          <slot></slot>
        </div>

        <v-divider></v-divider>

        <v-card-actions v-if="!$props.options">
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="close()"
          >
            Ok
          </v-btn>
        </v-card-actions>
        <v-card-actions v-else>
          <v-spacer></v-spacer>
          <v-btn
            text
            class="button-cancelar"
            @click="close()"
          >
            Cancelar
          </v-btn>
           <v-btn
            :key="valid_settings"
            text
            class="button-confirmar"
            :disabled="settings && !valid_settings" 
            @click="confirm()"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>  

<script>
export default {
    props: {
      visible: Boolean,
      title: String,
      options: Boolean,
      settings: Boolean,
      valid_settings: Boolean,
      more_width: Boolean,
      model: String,
      api: Boolean,
      datagen: Boolean
    },
    data() {
      return {
        get token() { return localStorage.getItem("token") },
        session: false
      }
    },
    mounted() {
      if (this.token !== null) this.session = true

      window.addEventListener('session', (event) => {
        this.session = event.detail.storage.session
      })
    },
    methods: {
      redirect() { window.open("https://datagen.di.uminho.pt/") },
      close() { this.$emit('close') },
      confirm() { this.$emit('confirm') },
      copy() {
        navigator.clipboard.writeText(this.model)
        this.$buefy.toast.open("Modelo copiado!")
      },
      download() {
        let element = document.createElement('a')
        element.style.display = 'none'

        element.setAttribute('href', `data:text/plain;charset=utf-8,` + encodeURIComponent(this.model))
        element.setAttribute('download', "DataGen_model.txt")

        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
      }
    }
}
</script>

<style scoped>
@import '../utils/buefy.css';

.message {
  margin: 20px 5%;
}

.btns {
  display: flex;
  align-items: flex-end;
}

.v-btn--fab {
  height: 45px !important;
  width: 45px !important;
}
</style>