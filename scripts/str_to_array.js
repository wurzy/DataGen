var str = "Partido do Centro, Partido Popular, Iniciativa Feminista, União Nacional dos Agricultores, Lista de Junho, Democratas Cristãos, Partido Moderado, Verdes, Coligação dos Cidadãos, Partidos do Meio, Partido Nacional [Liga Eleitoral Geral], Nova Democracia, Partido Pirata, Sociais-Democratas, Democratas da Suécia, Lista Sarajevo, Partido Comunista da Suécia [Hoglund], Partido Liberal da Suécia, Partido Socialista, Partido de Interesse do Cidadão Sueco, Partido Social Democrata da Suécia -- 1921, Partido de Esquerda (Comunistas), Partido Socialista de Esquerda"

var fs = require('fs');

/* fs.writeFile('novo_arr.json', JSON.stringify(str.split(", "), null, 2), (err) => {
    if (err) throw err;
    console.log('Data written to file');
}) */

var arr = require('./fix.json')
console.log(arr.join(', '))