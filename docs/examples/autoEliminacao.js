<!LANGUAGE pt>
{
  autoEliminação: {
        fonteLegitimação: {
          	tipo: '{{random("PGD/LC", "TS/LC", "PGD", "RADA", "RADA/CLAV")}}',
        	diploma(gen) {
              	var portaria = `Portaria ${gen.integer(300,500)}/${gen.integer(2000,2021)}`
                var despacho = `Despacho DGLAB ${gen.integer(100,500)}/${gen.integer(2000,2021)}` 
            	return gen.random("LC", portaria, despacho)
            }
        },
    	fundos(gen) {
        	if (["PGD/LC","TS/LC","PGD"].includes(this.fonteLegitimação.tipo))
            	return [gen.pt_entity()]
          	else {
            	var arr = []
                for (var i = 0; i < gen.integer(1,5); i++) arr.push(gen.pt_entity())
            	return arr
            }
        },
    	classes: [ 'repeat(2,5)': {
            if (["PGD/LC","TS/LC"].includes(this.fonteLegitimação.tipo)) {
              código: gen => {
                  var nivel1 = gen.random(...gen.range(100,950,50))
                  var nivel2 = gen.random(10,20,30,40,50)
                  var nivel3 = gen.integer(1,999,3)
                  var nivel4 = gen.random("01","02")

                  var classe = nivel1 + '.' + nivel2 + '.' + nivel3
                  if (Math.random() > 0.5) classe += '.' + nivel4
				  return classe
              }
  			}
            else {
              	at_least(1) {
                  	código(gen) {
                  		var nivel1 = gen.random(...gen.range(100,950,50))
                        var nivel2 = gen.random(10,20,30,40,50)
                        var nivel3 = gen.integer(001,999)
                        var nivel4 = gen.random("01","02")

                        var classe = nivel1 + '.' + nivel2 + '.' + nivel3
                        if (Math.random() > 0.5) classe += '.' + nivel4
                        return classe
                    },
            		referência: '{{random(1,2,3,55,56)}}'
                }
            },
            if (["PGD/LC","TS/LC"].includes(this.fonteLegitimação.tipo)) {
            	naturezaIntervenção: '{{random("DONO", "PARTICIPANTE", "DONO/PARTICIPANTE")}}',
				if (["PARTICIPANTE","DONO/PARTICIPANTE"].includes(this.naturezaIntervenção)) {
                	donos: [ 'repeat(1,5)': '{{pt_entity_abbr()}}' ]
                }
            },
            anoInício: '{{integer(1921,2021)}}',
            anoFim(gen) {
            	var ano = gen.integer(1921,2021)
                while (ano < this.anoInício) ano = gen.integer(1921,2021)
              	return ano
            },
            dimensãoSuporte: {
              	at_least(1) {
                    papel: '{{integer(1,2000)}}',
                    digital: '{{integer(1,2000)}}',
                    outro: {
                        valor: '{{integer(1,2000)}}',
                        unidade: '{{lorem("words",1)}}'
                    }
              	}
            },
  			númeroAgregações: '{{integer(1,50)}}',
            agregações: [ 'repeat(this.númeroAgregações)': {
            	código: '{{pt_entity_abbr()}} - {{integer(1,200)}}',
              	título: '{{lorem("words",3)}}',
              	ano: '{{integer(1921,2021)}}',
              	if (["PGD/LC","TS/LC"].includes(this.fonteLegitimação.tipo)) {
            		naturezaIntervenção: '{{random("PARTICIPANTE","DONO")}}'
            	}
            }]
        }]
  }
}