<!LANGUAGE pt>
{
  	cidades: [ 'repeat(100)': {
        id_cidade: 'c{{index(1)}}',
        nome: unique('{{pt_city()}}'),
        população: '{{integer(1500, 550000)}}',
        descrição: '{{lorem("paragraphs", 1)}}',
        distrito: '{{pt_district("city", this.nome)}}'
  	}],
  	ligações(gen) {
		var id = 1
      	var cidades = this.cidades.map(x => x.id_cidade)
		var possiveis = cidades.flatMap((v, i) => cidades.slice(i+1).map( w => v + '|' + w ))
  		var ligs = []
        
        for (var i = 0; i < 2000; i++) {
			let l = gen.random(...possiveis)
			possiveis.splice(possiveis.indexOf(l), 1)

			var split = l.split('|')
      		ligs.push({
				id_ligação: `l${id++}-${split[0]}-${split[1]}`,
				origem: split[0],
				destino: split[1],
				distância: gen.float(5, 600)
			})
        }
		
		return ligs
  	}
}