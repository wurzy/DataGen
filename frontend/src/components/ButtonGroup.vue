<template>
<div class="container">
        <div class="form-group float-right" style="padding-right:0px; margin-bottom: 0px; margin-right: -22px">
    			<div class="input-group">
    				<div id="radioBtn" class="btn-group">
    					<a class="btn btn-primary active" data-toggle="fun" data-title="JSON">JSON</a>
                        <a class="btn btn-success notActive" data-toggle="fun" data-title="XML">XML</a>
                        <a class="btn btn-danger notActive" data-toggle="fun" data-title="CSV">CSV</a>
    				</div>
    			</div>
    		</div>
        </div>
</template>
<script>
import $ from 'jquery'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

export default {
    name: "ButtonGroup",
    mounted(){
        var vue = this
        $('#radioBtn a').on('click', function(){
            var sel = $(this).data('title');
            var tog = $(this).data('toggle');
            $('a[data-toggle="'+tog+'"]').not('[data-title="'+sel+'"]').removeClass('active').addClass('notActive');
            $('a[data-toggle="'+tog+'"][data-title="'+sel+'"]').removeClass('notActive').addClass('active');
            vue.$emit('toggleConversionType',sel)
        })
    }
}
</script>
<style scoped>
#radioBtn .notActive{
    color: black;
    background-color: #fff;
}
</style>