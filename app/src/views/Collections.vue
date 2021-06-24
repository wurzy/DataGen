<template>
    <div>
        <Confirm :msg="getConfirmMsg" id="deleteCollection_confirm_modal" @confirm="confirm"/>
<table class="table">
  <thead class="thead-light">
    <tr>
      <th style="width:10%; text-align:center" scope="col">#</th>
      <th style="width:70%; text-align:center" scope="col">Nome</th>
      <th style="width:20%; text-align:center" scope="col">Operações</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(col, idx) in getCollections" :key="idx" >
      <th style="width:10%; text-align:center" scope="row">{{idx + 1}}</th>
      <td style="width:70%; text-align:center" >{{col}}</td>
      <td style="width:20%; text-align:center" >
          <button class="btn btn-sm btn-danger" @click="deleteCol(idx)"><font-awesome-icon icon="trash"/> Eliminar</button>
      </td>
    </tr>
  </tbody>
</table>
    </div>
</template>

<script>
import Confirm from '../components/Confirm.vue'
import axios from 'axios'
import $ from 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

export default {
    name: 'Collections',
    components: {
        Confirm
    },
    data() {
        return {
            collections: [],
            confirmMsg: "Esta ação é irreversível. Tem a certeza que pretende remover a coleção \"-\"?",
            toDelete: {}
        }
    },
    methods: {
        deleteCol(id){
            this.toDelete = {id, val: this.collections[id]}
            $("#deleteCollection_confirm_modal").modal("show");
            $("#deleteCollection_confirm_modal").css("z-index", "1500");
        },
        confirm(){
            axios.delete('/api/collection/' + this.toDelete.val)
                .then(dados => {
                    this.collections.splice(this.toDelete.id,1)
                })
                .catch(e => console.log(e))
        }
    },
    computed: {
        getCollections(){
            return this.collections
        },
        getConfirmMsg(){
            return this.confirmMsg.replace("-",this.toDelete.val)
        }
    },
    mounted() {
        axios.get('/api/collections')
            .then(dados => {
                this.collections = dados.data.ColNames
            })
            .catch(e => console.log(e))
    }
}
</script>

<style scoped>

</style>