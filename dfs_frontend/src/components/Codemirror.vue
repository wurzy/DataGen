<template>
    <v-container>
        <codemirror
            ref="text"
            :value="text"
            :options="options"
            v-on="type ? { input: onChange } : {}"
        />
    </v-container>
</template>

<script>
import { codemirror } from 'vue-codemirror'

// import base style
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/theme/dracula.css'
import 'codemirror/keymap/sublime'

export default {
    components: { codemirror },
    props: {
        type: String,
        mode: String,
        text: String
    },
    data() {
        return {
            options: {
                tabSize: 4,
                styleActiveLine: true,
                lineNumbers: true,
                line: true,
                foldGutter: true,
                styleSelectedText: true,
                keyMap: "sublime",
                mode: "text/" + this.mode,
                matchBrackets: true,
                showCursorWhenSelecting: true,
                theme: "dracula",
                extraKeys: { "Ctrl": "autocomplete" },
                hintOptions: { completeSingle: false }
            }
        }
    },
    methods: {
        onChange(newText) { this.$emit('changed', newText) }
    },
    computed: {
        codemirror() { return this.$refs.text.codemirror }
    },
    mounted() {
        this.codemirror.setSize("100%", "100%")
    }
}

</script>

<style>
.container { height: 100%; }
.vue-codemirror { height: 100%; }
.CodeMirror { height: 100%; }
.CodeMirror pre.CodeMirror-line, .CodeMirror pre.CodeMirror-line-like {
  font-size: smaller !important; 
}
.CodeMirror-linenumber {
  font-size: smaller !important;
}
</style>