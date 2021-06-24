var x = {if_2: true, demo: false}
var y = {demo: false}

var arg = ["10-01/2015","10/05/2019","10/05/2019"]
arg.every((val, i, arr) => /(((((0[1-9]|1[0-9]|2[0-8])\/(0[1-9]|1[012]))|((29|30|31)\/(0[13578]|1[02]))|((29|30)\/(0[4,6,9]|11)))\/(19|[2-9][0-9])[0-9][0-9])|(29\/02\/(19|[2-9][0-9])(00|04|08|12|16|20|24|28|32|36|40|44|48|52|56|60|64|68|72|76|80|84|88|92|96)))/.test(val))
console.log(l)

/* var fs = require('fs')
fs.writeFile('dataset.json', JSON.stringify(data, null, 2), (err) => {
  if (err) throw err;
  console.log('Data written to file');
}); */