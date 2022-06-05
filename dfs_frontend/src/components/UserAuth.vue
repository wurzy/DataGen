<template>
  <div>
    <Modal
        title="Erro ao registar"
        :visible="reg_error"
        @close="reg_error=false"
    >
      {{error_msg}}
    </Modal>

    <v-dialog :value="visible" 
      @input="$emit('update:visible',false)" 
      @keydown.enter="!tab ? login() : register()"
      @keydown.esc="close"
      @click:outside="close"
      min-width="360px"
      max-width="650px"
    >
      <v-tabs v-model="tab" show-arrows :background-color="`var(--${format.toLowerCase()}-primary)`" icons-and-text dark grow>
        <v-tabs-slider :color="`var(--${format.toLowerCase()}-primary)`"/>

        <v-tab v-for="(item,i) in tabs" :key="i">
          <v-icon large>{{ item.icon }}</v-icon>
          <div class="caption py-1">{{ item.name }}</div>
        </v-tab>

        <v-tab-item>
          <v-card class="px-4">
            <v-card-text>
              <v-form ref="loginForm" v-model="valid" lazy-validation>
                <v-row>
                  <v-col cols="12">
                    <v-text-field v-model="loginEmail" :rules="emailRules" label="E-mail" required></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="loginPassword" 
                      :rules="[rules.required, rules.min]" 
                      :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'" 
                      :type="show1 ? 'text' : 'password'"
                      label="Password" 
                      hint="Mínimo de 8 caracteres." 
                      counter
                      @click:append="show1=!show1"
                    ></v-text-field>
                  </v-col>
                  <v-col class="d-flex" cols="12" sm="6" xsm="12"/>
                  <v-spacer></v-spacer>
                  <v-col class="d-flex" cols="12" sm="3" xsm="12" align-end>
                    <v-btn x-large block :disabled="!valid" color="success" @click="login">Login</v-btn>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
          </v-card>
        </v-tab-item>

        <v-tab-item>
          <v-card class="px-4">
            <v-card-text>
              <v-form ref="registerForm" v-model="valid" lazy-validation>
                <v-row>
                  <v-col cols="12" sm="6" md="6">
                    <v-text-field v-model="firstName" :rules="[rules.required]" label="Nome" maxlength="20" required></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6" md="6">
                    <v-text-field v-model="lastName" :rules="[rules.required]" label="Apelido" maxlength="20" required></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field v-model="email" :rules="emailRules" label="E-mail" required></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="password"
                      :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
                      :rules="[rules.required, rules.min]" 
                      :type="show2 ? 'text' : 'password'"
                      label="Password" 
                      hint="Mínimo de 8 caracteres" 
                      counter 
                      @click:append="show2=!show2"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      block 
                      v-model="verify" 
                      :append-icon="show3 ? 'mdi-eye' : 'mdi-eye-off'" 
                      :rules="[rules.required, passwordMatch]"
                      :type="show3 ? 'text' : 'password'"
                      label="Confirmar Password" 
                      counter 
                      @click:append="show3=!show3"
                    ></v-text-field>
                  </v-col>
                  <v-spacer></v-spacer>
                  <v-col class="d-flex ml-auto" cols="12" sm="3" xsm="12">
                    <v-btn x-large block :disabled="!valid" color="success" @click="register">Registar</v-btn>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
          </v-card>
        </v-tab-item>
      </v-tabs>
    </v-dialog>
  </div>
</template>  

<script>
import Modal from '@/components/Modal'
import axios from 'axios'

export default {
  components: {
    Modal
  },
  computed: {
    passwordMatch() { return () => this.password === this.verify || "As passwords devem coincidir." }
  },
  methods: {
    close() { this.$emit('close') },
    async login() {
      if (this.$refs.loginForm.validate()) {
        try {
          let res = await axios.post('/api/utilizadores/login/', {email: this.loginEmail, password: this.loginPassword})
          let res2 = await axios.get('/api/utilizadores/' + res.data.token)
          
          localStorage.setItem('token', res.data.token)
          localStorage.setItem('user', JSON.stringify(res2.data))
          window.dispatchEvent(new CustomEvent("session", {detail: { storage: {session: true} }}))

          this.$buefy.toast.open("Login bem-sucedido!")
          this.$emit('logged_in')
          this.close()
      }
      catch(error) {
        this.error_msg = error.response.data.error
        this.reg_error = true
      }
      }
    },
    async register() {
      try {
        await axios.post('/api/utilizadores/registar', {
          nome: this.firstName.trim() + " " + this.lastName.trim(),
          email: this.email,
          password: this.password
        })
        
        let res = await axios.post('/api/utilizadores/login/', {email: this.email, password: this.password})
        let res2 = await axios.get('/api/utilizadores/' + res.data.token)

        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res2.data))

        this.$buefy.toast.open("Registado com sucesso!")
        this.$emit('logged_in')
        this.close()
      }
      catch(error) {
        this.error_msg = error.response.data.error
        this.reg_error = true
      }
    },
    reset() {
      this.$refs.form.reset();
    },
    resetValidation() {
      this.$refs.form.resetValidation();
    }
  },
  props: {
    format: String,
    visible: Boolean
  },
  data: () => ({
    tab: 0,
    tabs: [
        {name:"Login", icon:"mdi-account"},
        {name:"Registar", icon:"mdi-account-outline"}
    ],

    valid: true,
    show1: false,
    show2: false,
    show3: false,

    // erro de registo
    reg_error: false,
    error_msg: "",
    
    // registar
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    verify: "",

    // login
    loginEmail: "",
    loginPassword: "",

    rules: {
      required: value => !!value || "Requirido.",
      min: v => (v && v.length >= 8) || "Deve ter, no mínimo, 8 caracteres."
    },
    emailRules: [
      v => !!v || "Requirido.",
      v => /.+@.+\..+/.test(v) || "E-mail inválido."
    ]
  })
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