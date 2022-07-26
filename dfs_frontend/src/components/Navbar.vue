<template>
    <nav>
        <v-dialog v-model="pic_dialog" max-width="60%" @keydown.esc="pic_dialog=false" style="z-index:3;">
            <v-img v-if="datagen_tab=='xml'" src="../assets/example_xml.png" contain></v-img>
            <v-img v-else src="../assets/example_json.png" contain></v-img>
        </v-dialog>
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
            title="DataGen"
            datagen
            more_width
            :visible="datagen"
            @close="datagen=false"
        >
            <p>O <b>DataGen From Schemas</b> permite a customização dos modelos intermédios da DSL e, em consequência, dos datasets produzidos, diretamente a partir das schemas do utilizador, com <a href="https://datagen.di.uminho.pt/documentacao#moustaches" target="_blank">funções de interpolação do DataGen</a>.</p>

            <p>Desta forma, o utilizador pode configurar o conteúdo de elementos do dataset final para ser mais preciso e adequado em relação ao que é estabelecido na schema original, através do uso destas funções de interpolação. O maior interesse desta funcionalidade é usufruir das <a href="https://datagen.di.uminho.pt/documentacao#dataset_moustaches" target="_blank">funções com suporte de datasets</a> - que produzem informação de datasets de suporte, cada um com dados relativos a um tema concreto -, embora também seja possível usar as restantes <a href="https://datagen.di.uminho.pt/documentacao#gen_moustaches" target="_blank">funções de geração espontânea</a>.</p>
            <p>O modo de funcionamento desta ferramenta é o seguinte:</p>
            <ul>
                <li>a função utilizada substitui o conteúdo do elemento estabelecido na schema, no modelo intermédio da DSL produzido.;</li>
                <li>só podem ser utilizadas em elementos com <b>conteúdo elementar</b> (tipos numéricos, strings e boleanos);</li>
                <li>as <b>funções com suporte de datasets</b> podem produzir dados em <b>português</b> ou em <b>inglês</b>. O utilizador deve indicar a sua preferência nas definições;</li>
                <li>funções de interpolação permitidas:
                    <ul>
                        <li>todas as <a href="https://datagen.di.uminho.pt/documentacao#dataset_moustaches" target="_blank">funções com suporte de datasets</a>;</li>
                        <li>todas as <a href="https://datagen.di.uminho.pt/documentacao#gen_moustaches" target="_blank">funções de geração espontânea</a>, exceto <b>random</b>, <b>political_party</b> e <b>pt_entity</b> (uma vez que produzem/podem produzir informação estruturada - objetos/arrays);</li>
                    </ul>
                </li>
                <li>a nomenclatura utilizada difere com o tipo de schema em questão e é explicada abaixo:</li>
            </ul>
            <br>
            
            <v-tabs fixed-tabs :background-color="`var(--${datagen_tab}-primary)`" dark>
                <v-tabs-slider :color="`var(--${datagen_tab}-primary)`"/>
                
                <v-tab @click="datagen_tab='xml'">XML Schema</v-tab>
                <v-tab @click="datagen_tab='json'">JSON Schema</v-tab>

                <v-tab-item>
                    <v-card class="px-4">
                        <v-card-text class="black--text">
                            <ul>
                                <li>é possível personalizar o conteúdo de elementos <b>&#60;attribute&#62;</b> ou <b>&#60;element&#62;</b>;</li>
                                <li>o tipo-base do elemento em questão deve ser obrigatoriamente um tipo simples (<b>simpleType</b>). Não é possível usar funções de interpolação em elementos com tipos complexos (<b>complexType</b>);</li>
                                <li>a função utilizada substitui o conteúdo do elemento (definido através do atributo <b>type</b> ou de um elemento-filho <b>simpleType</b>), mas os seus atributos continuam em vigência - atributos como <b>nillable</b>, <b>fixed</b>, <b>default</b> e <b>use</b> serão considerados na mesma durante a geração do modelo de dados;</li>
                                <li>a função pretendida deve aparecer <b>em comentário</b> <u>dentro do elemento em questão</u>, <b>antes de qualquer elemento-filho</b>;</li>
                                <li>deve aparecer no seguinte formato: <code>&#60;!--datagen:<span style="color:red">{nome_função}{argumentos}</span>--&#62;</code>, por exemplo:
                                    <ul>
                                        <li><code>&#60;!--datagen:firstName()--&#62;</code></li>
                                        <li><code>&#60;!--datagen:time("hh:mm:ss", 12, false)--&#62;</code></li>
                                    </ul>
                                </li>
                                <li>se for uma função sem argumentos, basta indicar o nome da função. Por exemplo:
                                    <ul>
                                        <li><code>&#60;!--datagen:animal--&#62;</code></li>
                                        <li><code>&#60;!--datagen:firstName--&#62;</code></li>
                                    </ul>
                                </li>
                                <li>se tiver argumentos, escrever exatamente como se escreveria no DataGen. Por exemplo:
                                    <ul>
                                        <li><code>&#60;!--datagen:pt_county("district","Braga")--&#62;</code></li>
                                        <li><code>&#60;!--datagen:time("hh:mm:ss", 12, false)--&#62;</code></li>
                                    </ul>
                                </li>
                            </ul>
                            <br>
                            <v-img src="../assets/example_xml.png" contain @click="pic_dialog=true"/>
                        </v-card-text>
                    </v-card>
                </v-tab-item>

                <v-tab-item>
                    <v-card class="px-4">
                        <v-card-text class="black--text">
                            <ul>
                                <li>é possível personalizar o conteúdo de (sub)schemas do tipo <b>string</b>, <b>boolean</b>, <b>integer</b> ou <b>number</b> - o tipo de dados produzido pela função de interpolação deve corresponder ao tipo da schema onde se encontra;</li>
                                <li>a função utilizada substitui o conteúdo da respetiva schema, mas continuam em vigência chaves genéricas como <b>const</b>, <b>enum</b> e <b>default</b>;</li>
                                <li>a função pretendida deve aparecer como valor (string) da chave <b>_datagen</b>, <u>na schema em questão</u>;</li>
                                <li>deve aparecer no seguinte formato: <code>"_datagen": "<span style="color:red">{nome_função}{argumentos}</span>"</code>, por exemplo:
                                    <ul>
                                        <li><code>"_datagen": "firstName()"</code></li>
                                        <li><code>"_datagen": "time("hh:mm:ss", 12, false)"</code></li>
                                    </ul>
                                </li>
                                <li>se for uma função sem argumentos, basta indicar o nome da função. Por exemplo:
                                    <ul>
                                        <li><code>"_datagen": "animal"</code></li>
                                        <li><code>"_datagen": "firstName"</code></li>
                                    </ul>
                                </li>
                                <li>se tiver argumentos, escrever como se escreveria no DataGen, apenas encapsulando os argumentos que sejam strings com apóstrofes em vez de aspas. Por exemplo:
                                    <ul>
                                        <li><code>"_datagen": "pt_county('district','Braga')"</code></li>
                                        <li><code>"_datagen": "time('hh:mm:ss', 12, false)"</code></li>
                                    </ul>
                                </li>
                            </ul>
                            <br>
                            <v-img src="../assets/example_json.png" contain @click="pic_dialog=true"/>
                        </v-card-text>
                    </v-card>
                </v-tab-item>
            </v-tabs>
        </Modal>
        <Modal
            title="Rotas Aplicacionais"
            api
            more_width
            :visible="api"
            @close="api=false"
        >
            <v-tabs fixed-tabs :background-color="`var(--${api_tab}-primary)`" dark>
                <v-tabs-slider :color="`var(--${api_tab}-primary)`"/>
                
                <v-tab @click="api_tab='xml'">XML Schema</v-tab>
                <v-tab @click="api_tab='json'">JSON Schema</v-tab>

                <v-tab-item>
                    <v-card class="px-4">
                        <v-card-text class="black--text">
                            <ul>
                                <li class="text-md-body-1"><b><code>POST</code> /api/xml_schema/xml</b></li>
                                <li class="text-md-body-1"><b><code>POST</code> /api/xml_schema/json</b></li>
                                <br>
                                <p>Estas rotas retornam um objeto JSON com o dataset no formato indicado, dado em forma de string, e o respetivo modelo da DSL do DataGen, gerados a partir de uma schema XML.</p>
                                <p>O corpo do pedido deve ter apenas três propriedades: <b>schema</b>, <b>element</b> e <b>settings</b>, sendo que a <b>schema</b> deve estar em forma de string e <b>element</b> é o elemento-raiz da schema que se pretende gerar. As definições devem ser enviadas num objeto com as seguintes propriedades:</p>
                                <ul style="font-size: 14px">
                                    <li><b>datagen_language</b> - língua dos resultados de funções (com suporte de datasets) do DataGen; deve ser "pt" (português) ou "en" (inglês).</li>
                                    <li><b>recursion</b> - objeto com os limites de recursividade, deve possuir as seguintes propriedades:
                                        <ul>
                                            <li><b>lower</b> - limite inferior de recursividade; deve ser um inteiro não-negativo.</li>
                                            <li><b>upper</b> - limite superior de recursividade; deve ser um inteiro não-negativo.</li>
                                        </ul>
                                    </li>
                                    <li><b>unbounded</b> - máximo de ocorrências de um elemento com o atributo 'maxOccurs' a "unbounded"; deve ser um inteiro não-negativo.</li>
                                    <li><b>prob_default</b> - probabilidade de uma instância de um elemento &#60;attribute&#62;/&#60;element&#62; com o atributo 'default' ter esse valor predefinido; deve ser um número entre 0 e 100.</li>
                                    <li><b>prob_nil</b> - probabilidade de uma instância de &#60;element&#62; com o atributo 'nillable' a verdadeiro ter o valor explícito 'nil'; deve ser um número entre 0 e 100.</li>
                                    <li><b>prob_noAll</b> - probabilidade de um elemento &#60;all&#62; com o atributo 'minOccurs' a 0 não ocorrer; deve ser um número entre 0 e 100.</li>
                                </ul>
                            </ul>
                        </v-card-text>
                    </v-card>
                </v-tab-item>

                <v-tab-item>
                    <v-card class="px-4">
                        <v-card-text class="black--text">
                            <ul>
                                <li class="text-md-body-1"><b><code>POST</code> /api/json_schema/json</b></li>
                                <li class="text-md-body-1"><b><code>POST</code> /api/json_schema/xml</b></li>
                                <br>
                                <p>Estas rotas retornam um objeto JSON com o dataset no formato indicado, dado em forma de string, e o respetivo modelo da DSL do DataGen, gerados a partir de uma schema JSON.</p>
                                <p>O corpo do pedido deve ter apenas três propriedades: <b>main_schema</b>, <b>other_schemas</b> e <b>settings</b>, sendo que <b>main_schema</b> é a schema a partir da qual se pretende gerar o dataset, <b>other_schemas</b> é um array com as restantes schemas e tanto a <b>main_schema</b> como as restantes devem estar em forma de objeto JSON. As definições devem ser enviadas num objeto com as seguintes propriedades:</p>
                                <ul style="font-size: 14px">
                                    <li><b>datagen_language</b> - língua dos resultados de funções (com suporte de datasets) do DataGen; deve ser "pt" (português) ou "en" (inglês).</li>
                                    <li><b>recursion</b> - objeto com os limites de recursividade, deve possuir as seguintes propriedades:
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
                        </v-card-text>
                    </v-card>
                </v-tab-item>
            </v-tabs>
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

            <v-btn color="#9b66f4" style="margin-right:10px;" :disabled="loading" @click="datagen=true">
                <span>DataGen</span>
                <v-icon right>mdi-arrow-top-right-bold-box-outline</v-icon>
            </v-btn>

            <v-btn color="#9b66f4" style="margin-right:10px;" :disabled="loading" @click="api=true">
                <span>API</span>
                <v-icon right>mdi-file-document</v-icon>
            </v-btn>

            <div v-if="!session" class="btns">
                <v-btn :color="color('secondary')" :disabled="loading" @click="user_auth=true">
                    <span>Login</span>
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
    watch: {
        datagen_tab() {console.log(this.datagen_tab)}
    },
    data() {
        return {
            get token() { return localStorage.getItem("token") },
            session: false,
            user_auth: null,
            loading: false,
            api: false,
            datagen: false,
            pic_dialog: false,
            api_tab: "xml",
            datagen_tab: "xml",

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