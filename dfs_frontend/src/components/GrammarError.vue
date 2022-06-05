<template>
	<div class="modal-dialog modal-confirm fill-height">
		<div class="modal-content">
			<div class="modal-header">
				<div class="icon-box">
					<v-icon color="white">mdi-close</v-icon>
				</div>
			</div>
		</div>
		<div class="grammar-error">
			<h4 style="text-align: center; padding-bottom: 20px;">Existe um erro no modelo!</h4>
			<div v-for="(error, idx) in errors" :key="idx" style="padding: 0 40px 0 40px;">
				<div v-html="error.message"></div>
				<ul>
					<li style="text-align: left !important;"> <b> Início:</b> Linha <b>{{error.location.start.line}}</b>, Coluna <b>{{error.location.start.column}}</b></li>
					<li style="text-align: left !important;"> <b> Fim:</b> Linha <b>{{error.location.end.line}}</b>, Coluna <b>{{error.location.end.column}}</b></li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script>
export default {
    name: "GrammarError",
    props: ['errors']
}
</script>

<style scoped>
.modal-confirm {		
	color: #434e65;
	margin:0;
}
.modal-confirm .modal-content {
	font-size: 16px;
	border-radius: 5px;
	border: none;

}
.modal-confirm .modal-header {
	background: #cc4242;
	border-bottom: none;   
	position: relative;
	text-align: center !important;
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
	margin: -4px 0 0 -4px;
}
.modal-confirm .btn {
	color: #fff;
	border-radius: 4px;
	background: #eeb711;
	text-decoration: none;
	transition: all 0.4s;
	line-height: normal;
	border-radius: 30px;
	margin-top: 10px;
	padding: 6px 20px;
	border: none;
}
.modal-confirm .btn:hover, .modal-confirm .btn:focus {
	background: #eda645;
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
  max-width: 100% !important;
  position:none;
  width:none;
  display:inherit;
}

ol > div > li::marker {
	font-weight: bold;
}

h4 {
	margin-top: 0px !important;
	padding-top: 15px;
}

.grammar-error {
  border: 2px solid black;
  border-top: none;
  border-radius: 0 0 10px 10px;
  outline-offset: -2px;
  background-color: white !important;
  padding-bottom: 50px;
}
</style>