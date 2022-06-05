<template>
    <codemirror 
        ref="text"
        :value="text"
        :options="options"
        v-on="type ? { input: onChange } : {}"
    />
</template>

<script>
import { codemirror } from 'vue-codemirror'

// import base style
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/mode/xml/xml.js'
import 'codemirror/theme/dracula.css'
import 'codemirror/keymap/sublime'
import 'codemirror/addon/display/autorefresh'

export default {
    components: { codemirror },
    props: {
        type: String,
        mode: String,
        text: String,
        generate: String,
        modal: Boolean
    },
    computed: {
        codemirror() { return this.$refs.text.codemirror }
    },
    data() {
        return {
            options: {
                tabSize: 4,
                styleActiveLine: true,
                lineNumbers: true,
                autoRefresh: true,
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
    mounted() {
        if (this.modal) {
            this.options.lineNumbers = false
            setTimeout(() => (this.options.lineNumbers = true), 100)
        }
    },
    methods: {
        onChange(newText) { this.$emit('changed', newText) }
    },
    watch: {
        generate() {
            this.options.mode = "text/" + this.mode
        }
    }
}

</script>

<style>
.container { height: 100%; }
.vue-codemirror { height: calc( 100vh - 200px ); }
.CodeMirror { height: calc( 100vh - 200px ); }
.CodeMirror pre.CodeMirror-line, .CodeMirror pre.CodeMirror-line-like {
  font-size: smaller !important; 
}
.CodeMirror-linenumber {
  font-size: smaller !important;
}
</style>