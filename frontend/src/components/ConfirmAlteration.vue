<template>
<div>
    <!-- Modal HTML -->
    <div :id="id" class="modal fade">
        <div class="modal-dialog modal-confirm">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="icon-box">
                        <i class="material-icons">&#x21;</i>
                    </div>
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                </div>
                <div class="modal-body text-center">
                    <h4>Aviso</h4>	
                    <p> {{msg}} </p>
                    <button class="color-b1 btn btn-success" data-dismiss="modal"><span>Cancelar <font-awesome-icon icon="undo"/></span></button>
                    <button class="color-b2 btn btn-success" @click="confirm" data-dismiss="modal" style="margin-left:10px"><span>Guardar <font-awesome-icon icon="save"/></span></button>
                </div>
            </div>
        </div>
    </div>   
</div>
</template>
<script>
export default {
    name: "ConfirmAlteration",
    props: ['msg', 'id'],
    methods:{
        confirm(){
            this.$emit('confirm')
        }
    }
}
</script>
<style scoped>

    .modal-confirm {		
		color: #434e65;
		width: 525px;
		margin: 30px auto;
	}
	.modal-confirm .modal-content {
		padding: 20px;
		font-size: 16px;
		border-radius: 5px;
		border: none;
	}
	.modal-confirm .modal-header {
		background: #eda645;
		border-bottom: none;   
        position: relative;
		text-align: center !important;
		margin: -20px -20px 0;
		border-radius: 5px 5px 0 0;
		padding: 35px;
	}
	.modal-confirm h4 {
		text-align: center;
		font-size: 36px;
		margin: 10px 0;
	}
	.modal-confirm .form-control, .modal-confirm .btn {
		min-height: 40px;
		border-radius: 3px; 
	}
	.modal-confirm .close {
        position: absolute;
		top: 15px;
		right: 15px;
		color: #fff;
		text-shadow: none;
		opacity: 0.5;
	}
	.modal-confirm .close:hover {
		opacity: 0.8;
	}
	.modal-confirm .icon-box {
		color: #fff;		
		width: 95px;
		height: 95px;
		display: inline-block;
		border-radius: 50%;
		z-index: 9;
		border: 5px solid #fff;
		padding: 15px;
		text-align: center;
	}
	.modal-confirm .icon-box i {
		font-size: 64px;
		margin: -14px;
	}
    .modal-confirm .color-b2 {
        color: #fff;
        border-radius: 4px;
		background: #27cc4d;
		text-decoration: none;
		transition: all 0.4s;
        line-height: normal;
		border-radius: 30px;
		margin-top: 10px;
		padding: 6px 20px;
        border: none;
    }

    .modal-confirm .color-b1 {
        color: #fff;
        border-radius: 4px;
		background: #8a8a8a;
		text-decoration: none;
		transition: all 0.4s;
        line-height: normal;
		border-radius: 30px;
		margin-top: 10px;
		padding: 6px 20px;
        border: none;
    }


	.modal-confirm .color-b2:hover, .modal-confirm .color-b2:focus {
		background: #28a745;
		outline: none;
	}

	.modal-confirm .color-b1:hover, .modal-confirm .color-b1:focus {
		background: #666666;
		outline: none;
	}

	.modal-confirm .btn span {
		margin: 1px 3px 0;
		float: left;
	}
	.modal-confirm .btn i {
		margin-left: 1px;
		font-size: 20px;
		float: right;
	}
    .modal-header{
        display:block;
    }
.modal {
  text-align: center;
  padding: 0!important;
}

.modal:before {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  margin-right: -18px;
}

.modal-dialog {
  display: inline-block;
  text-align: left;
  vertical-align: middle;
  margin-bottom: 200px;
}
</style>