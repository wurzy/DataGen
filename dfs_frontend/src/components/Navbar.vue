<template>
    <nav>
        <Modal
            title="Aviso"
            options
            :visible="warning"
            @close="cancelChange"
            @confirm="resetSchemas"
        >
            {{warningMsg}}
        </Modal>
        <Modal
            title="Rotas Aplicacionais"
            more_width
            :visible="api"
            @close="api=false"
        >
            <ul>
                <li><b><code>POST</code> /api/xml_schema/xml</b></li>
                <li><b><code>POST</code> /api/xml_schema/json</b></li>
                <br>
                <p>Estas rotas retornam um objeto JSON com o dataset no formato indicado, dado em forma de string, e o respetivo modelo da DSL do DataGen, gerados a partir de uma schema XML.</p>
                <p>O corpo do pedido deve ter apenas três propriedades: <b>schema</b>, <b>element</b> e <b>settings</b>, sendo que a <b>schema</b> deve estar em forma de string e <b>element</b> é o elemento-raiz da schema que se pretende gerar. As definições devem ser enviadas num objeto com as seguintes propriedades:</p>
                <ul style="font-size: 14px">
                    <li><b>recursivity</b> - objeto com os limites de recursividade, deve possuir as seguintes propriedades:
                        <ul>
                            <li><b>lower</b> - limite inferior de recursividade; deve ser um inteiro não-negativo.</li>
                            <li><b>upper</b> - limite superior de recursividade; deve ser um inteiro não-negativo.</li>
                        </ul>
                    </li>
                    <li><b>unbounded</b> - máximo de ocorrências de um elemento quando maxOccurs="unbounded"; deve ser um inteiro não-negativo.</li>
                </ul>
            </ul>
            <br><hr><br>
            <ul>
                <li><b><code>POST</code> /api/json_schema/json</b></li>
                <li><b><code>POST</code> /api/json_schema/xml</b></li>
                <br>
                <p>Estas rotas retornam um objeto JSON com o dataset no formato indicado, dado em forma de string, e o respetivo modelo da DSL do DataGen, gerados a partir de uma schema JSON.</p>
                <p>O corpo do pedido deve ter apenas três propriedades: <b>main_schema</b>, <b>other_schemas</b> e <b>settings</b>, sendo que <b>main_schema</b> é a schema a partir da qual se pretende gerar o dataset, <b>other_schemas</b> é um array com as restantes schemas e tanto a <b>main_schema</b> como as restantes devem estar em forma de objeto JSON. As definições devem ser enviadas num objeto com as seguintes propriedades:</p>
                <ul style="font-size: 14px">
                    <li><b>recursivity</b> - objeto com os limites de recursividade, deve possuir as seguintes propriedades:
                        <ul>
                            <li><b>lower</b> - limite inferior de recursividade; deve ser um inteiro não-negativo.</li>
                            <li><b>upper</b> - limite superior de recursividade; deve ser um inteiro não-negativo.</li>
                        </ul>
                    </li>
                    <li><b>prob_if</b> - probabilidade de a schema da condição validar a instância; deve ser um número entre 0 e 100.</li>
                    <li><b>prob_patternProperty</b> - probabilidade de gerar uma propriedade a partir de uma <i>patternProperty</i>; deve ser um número entre 0 e 100.</li>
                    <li><b>random_props</b> - possibilidade de gerar propriedades aleatórias (dentro do tamanho indicado para o objeto) se não forem especificadas <i>additionalProperties</i> nem <i>unevaluatedProperties</i>; deve ser um boleano.</li>
                    <li><b>extend_objectProperties</b> - modo de proceder ao estender propriedades repetidas nas chaves <i>properties</i> e <i>patternProperties</i>; deve ser uma das seguintes strings:
                        <ul>
                            <li><u>extend</u>/<u>overwrite</u> - se as chaves tiverem propriedades repetidas, estende/substitui a schema de cada propriedade da chave-base com a respetiva schema da mesma propriedade da chave nova. Todas as propriedades originais da nova chave são atribuídas à chave-base.</li>
                        </ul>
                    </li>
                    <li><b>extend_schemaProperties</b> - modo de proceder ao estender chaves cujo valor é uma subschema (<i>propertyNames</i>, <i>additionalProperties</i>, <i>unevaluatedProperties</i>, <i>items</i> ou <i>unevaluatedItems</i>); deve ser uma das seguintes strings:
                        <ul>
                            <li><u>extend</u>/<u>overwrite</u> - estende/substitui a schema da chave-base com a schema da chave nova.</li>
                        </ul>
                    </li>
                    <li><b>extend_prefixItems</b> - modo de proceder ao estender a chave <i>prefixItems</i>; deve ser uma das seguintes strings:
                        <ul>
                            <li><u>extend</u> - para todas as schemas que se encontram no mesmo índice, estende as da chave-base com as respetivas schemas da nova chave. Se a chave nova tiver mais elementos do que a base, os elementos extra são também concatenados.</li>
                            <li><u>append</u> - os elementos do novo <i>prefixItems</i> são concatenados aos da chave-base.</li>
                            <li><u>partial_overwrite</u> - sobrescreve apenas as schemas da chave-base com uma schema correspondente no mesmo índice, na chave nova. Se a chave nova tiver mais elementos do que a base, os elementos extra são também concatenados.</li>
                            <li><u>total_overwrite</u> - o valor da chave-base é apagado totalmente e substítuido pelo array do novo <i>prefixItems</i></li>
                        </ul>
                    </li>
                </ul>
            </ul>
        </Modal>

        <UserAuth
            :format="format" 
            :visible="user_auth" 
            @close="user_auth=false"
            @logged_in="session=true"
        />

        <v-app-bar flat app dark :color="color('primary')">
            <span class="title inline">DataGen From </span>
            <ButtonGroup :key="rollback" class="type-schema" :format="format" :loading="loading" @changed="update"/>
            <span class="title"> Schemas</span>
            <v-spacer></v-spacer>

            <v-btn color="#9b66f4" style="margin-right:10px;" :disabled="loading" @click="datagen">
                <span>DataGen</span>
                <v-icon right>mdi-arrow-top-right-bold-box-outline</v-icon>
            </v-btn>

            <v-btn color="#9b66f4" style="margin-right:10px;" :disabled="loading" @click="api=true">
                <span>API</span>
                <v-icon right>mdi-file-document</v-icon>
            </v-btn>

            <div v-if="!session" class="btns">
                <v-btn :color="color('secondary')" :disabled="loading" @click="user_auth=true">
                    <span>Entrar</span>
                    <v-icon right>mdi-login</v-icon>
                </v-btn>
            </div>
            <div v-else class="btns">
                <v-btn :color="color('secondary')" :disabled="loading" @click="logout">
                    <span>Logout</span>
                    <v-icon right>mdi-logout</v-icon>
                </v-btn>
            </div>
        </v-app-bar>
    </nav>
</template>

<script>
import ButtonGroup from '@/components/ButtonGroup'
import UserAuth from '@/components/UserAuth'
import Modal from '@/components/Modal'
import axios from 'axios'

export default {
    components: {
        ButtonGroup,
        UserAuth,
        Modal
    },
    props: {
        format: String
    },
    data() {
        return {
            get token() { return localStorage.getItem("token") },
            session: false,
            user_auth: null,
            loading: false,
            api: false,

            get no_input() { return localStorage.getItem("no_input") },
            new_format: "",
            rollback: 0,
            warning: false,
            warningMsg: ""
        }
    },
    mounted() {
        if (this.token !== null) this.session = true
        window.addEventListener('loading', (event) => { this.loading = event.detail.storage.loading })
    },
    methods: {
        datagen() { window.open("https://datagen.di.uminho.pt/") },
        color(type) { return `var(--${this.format.toLowerCase()}-${type})` },
        update(format) {
            if (this.no_input == true) { this.emitChange(format) }
            else {
                this.new_format = format
                this.warningMsg = `Se mudar o tipo de schema a processar, perderá a(s) schema(s) ${this.format} que introduziu. Deseja proceder?`
                this.warning = true
            }
        },
        cancelChange() {
            this.rollback++
            this.warning = false
        },
        resetSchemas() {
            this.warning = false
            localStorage.setItem("no_input", 1)
            this.emitChange(this.new_format)
        },
        emitChange(new_format) {
            window.dispatchEvent(new CustomEvent("reset_schemas"))
            this.$emit('changed', new_format)
        },
        logout() {
            axios.post('/api/utilizadores/logout', {token: this.token})
                .then(data => {
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')

                    this.session = false
                    this.$buefy.toast.open("Logout bem-sucedido!")

                    window.dispatchEvent(new CustomEvent("session", {detail: { storage: {session: false} }}))
                })
                .catch(error => console.log(error))
        }
    }
}
</script>

<style scoped>
.title {
    font-size: 1.25rem;
    font-family: "Roboto", sans-serif;
}

.inline {
    display: inline
}

.v-input {
    font-size: 1.25rem !important;
    max-width: 5.5rem !important;
}

.type-schema {
    display: inline-block;
    margin-right: 10px;
    margin-left: 10px;
}

.vs--single.vs--open .vs__selected { position: inherit; }

.btns {
  display: flex;
  align-items: flex-end;
}
</style>