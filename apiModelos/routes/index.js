var express = require('express');
var router = express.Router();
const fs = require("fs")
const fsEx = require('fs-extra')
const AdmZip = require('adm-zip')
const archiver = require('archiver');
const axios = require('axios')
const isReachable = require('is-reachable');
var execSync = require('child_process').execSync;
const { cachedDataVersionTag } = require('v8');
var rimraf = require("rimraf");

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://mongo:27017";


const model123 = `{
  "kind": "collectionType",
  "collectionName": "Dataset",
  "info": {
    "name": "Dataset",
    "description": ""
  },
  "options": {
    "increments": true,
    "timestamps": true,
    "draftAndPublish": true
  },
  "attributes": {
    "titulo": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "preco": {
      "type": "decimal"
    },
    "quantidade": {
      "type": "integer"
    },
    "descricao": {
      "type": "text"
    },
    "prod": {
      "type": "component",
      "repeatable": false,
      "component": "produtor.produtor"
    }
  }
}
`

const strContro = `'use strict';
  
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {};`  

const strModels = `'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {};`

const strServices = `'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {};
`

router.get('/teste', function(req, res, next) {
  
  console.log("Docker a funfar")

    res.status(200).jsonp({msg : "Docker a funfar "})
    res.end()
  
});

router.get('/collections', function(req, res, next) {
  fs.readdir("../StrapiAPI/api/", (err, files) => { 
    if(err) { 
      res.status(500).jsonp({erro : "Error on fetching collections names: ",err})
    } 
    for (var i = files.length; i--;) {
      if (files[i] === ".gitkeep") files.splice(i, 1);
    }
    res.status(200).jsonp({
      ColNames: files,
    })
    res.end()
  }); 
});

router.delete('/collection/:name', function(req, res, next) {
  
    MongoClient.connect(url,{useNewUrlParser: true, useUnifiedTopology: true}).then((client) => {
     
      var cols=[]
      cols.push(req.params.name)
      if(fs.existsSync('../StrapiAPI/components/'+req.params.name)){
        fs.readdirSync('../StrapiAPI/components/'+req.params.name).forEach(file => {
          String(file)
          let str = file.replace(".json", "");
          cols.push("components_"+str)
        });
      }
      console.log("cols:"+cols)
      const connect = client.db("StrapiAPI");
      var result = []
      var collection
      cols.forEach(element => {
        collection = connect.collection(element);
        //var suc = collection.drop() // Dropping the collection
        collection.drop().catch(err =>{
          if(err){
            if(err.message.match(/ns not found/)){
              result.push(2) 
            }else{
              result.push(0) 
              console.log("dabase error:",err)
            } 
          }else{
            result.push(1) 
          } 
        });
      });
    

     
      if(fs.existsSync('../StrapiAPI/api/'+req.params.name)){rimraf.sync("../StrapiAPI/api/"+req.params.name);}

      if(fs.existsSync('../StrapiAPI/components/'+req.params.name)){rimraf.sync('../StrapiAPI/components/'+req.params.name); }

      if(result.includes(0)) {
        console.log("Error deleting collection!");
        res.status(500).jsonp("Error deleting collection!")
        res.end() 
      }else if(result.includes(2)){
        console.log("Collection or components don´t exist!");
        res.status(404).jsonp("Collection doesn´t exist!")
        res.end() 
      }else{
        console.log("Collection deleted Successfully!");
        res.status(200).jsonp("Collection deleted Successfully!")
        res.end() 
      }
  
     
          
  })

})

router.get('/download/:id', function(req, res, next) {
  try{
    var zip = AdmZip('./utils/Strapi.zip');
    if (fs.existsSync('../StrapiAPI/api/'+req.params.id) && fs.existsSync('../StrapiAPI/components/'+req.params.id)) {
      fs.readdirSync('../StrapiAPI/api/'+req.params.id).forEach(folder => {
        fs.readdirSync('../StrapiAPI/api/'+req.params.id+"/"+folder).forEach(file=>{
          zip.addLocalFile('../StrapiAPI/api/'+req.params.id+"/"+folder+"/"+file, '../Strapi/api/'+req.params.id+"/"+folder)
        })
      })
      fs.readdirSync('../StrapiAPI/components/'+req.params.id).forEach(file => {
        zip.addLocalFile('../StrapiAPI/components/'+req.params.id +"/"+file, "/Strapi/components/"+req.params.id)
      })
      //zip.writeZip("file.zip");
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${req.params.id}.zip`,
      })
      res.write(zip.toBuffer())
      res.end()
    } else {
      res.status(500).jsonp({erro : "API não existente"})
    }
  }
  catch(error){
    console.log(error)
  }
})

//router.get('/download/:id', function(req, res, next) {
// 
//  console.log(req.params.id)
//  try {
//    //const output = fs.createWriteStream("./api-"+req.params.id+".zip");
//    const archive = archiver('zip', {
//      zlib: { level: 9 } // Sets the compression level.
//    });
//    // listen for all archive data to be written
//    // 'close' event is fired only when a file descriptor is involved
//    archive.on('close', function() {
//      console.log(archive.pointer() + ' total bytes');
//      console.log('archiver has been finalized and the output file descriptor has closed.');
//      
//    });
//    
//    // This event is fired when the data source is drained no matter what was the data source.
//    // It is not part of this library but rather from the NodeJS Stream API.
//    // @see: https://nodejs.org/api/stream.html#stream_event_end
//    archive.on('end', function() {
//      console.log('Data has been drained');
//      res.end()
//    });
//
//    archive.on('warning', function(err) {
//      if (err.code === 'ENOENT') {
//        console.log('ENOENT')
//      } else {
//        throw err;
//      }
//    });
//    archive.on('error', function(err) {
//      throw err;
//    });
//
//    archive.pipe(res);
//
//    if (fs.existsSync('../StrapiAPI/api/'+req.params.id) && fs.existsSync('../StrapiAPI/components/'+req.params.id)) {
//      archive.append(fs.createReadStream("../Strapi.zip"), { name: 'Strapi.zip' });
//      archive.directory('../StrapiAPI/api/'+req.params.id,'api/'+req.params.id);
//      archive.directory('../StrapiAPI/components/'+req.params.id,'components/'+req.params.id);
//
//      archive.finalize();
//
//      res.writeHead(200, {
//        "Content-Type": "application/zip",
//        "Content-Disposition": `attachment; filename=${req.params.id}.zip`,
//      })
//    } else {
//      res.status(500).jsonp({erro : "API não existente"})
//    }
//    
//  } catch (error) {
//      res.status(500).jsonp({erro : "Erro ao zipar"})
//      
//  }
//});


/*//var zip = new AdmZip()
  //zip.addLocalFolder("./teste")
  //zip.writeZip("./testezipado.zip");
  console.log(req.params.id)
  try {
    var zip1 = new AdmZip("../Strapi.zip")
    console.log("1"); 
    zip1.addLocalFolder("../api/api/"+req.params.id,"/api/"+req.params.id)
    console.log("2"); 
    zip1.addLocalFolder("../api/components/"+req.params.id,"/components/"+req.params.id)
    console.log("3"); 
    zip1.writeZip("./api-"+req.params.id+".zip");
    //var buffer = zip1.toBuffer()
    console.log("4"); 

    //fs.writeFileSync("./api-"+req.params.id+".zip", buffer);
    console.log("5"); 

    return  console.log("zipado"); 

    //res.writeHead(200, {
    //  "Content-Type": "application/zip",
    //  "Content-Disposition": `attachment; filename=${filename}.zip`,
    //})*/
    

router.post('/genAPI', function(req, res, next) {
  var mkeys = Object.keys(req.body["model"])
  var apiname = req.body["apiName"]
  var dkeys = Object.keys(req.body["dataset"])
  //var dataName = dkeys[0]
  //var dataset = req.body["dataset"][`${dataName}`]
  
  var model = JSON.stringify(req.body["model"], null, 2)
  console.log("apiname: ",apiname)
  console.log("model. ",req.body["model"])
  

  try {
    fs.mkdirSync("../StrapiAPI/api/"+apiname) 

    fs.mkdirSync("../StrapiAPI/api/"+apiname+"/config")
  
      // Data which will write in a file. 
    let data = `{
"routes": [
  {
    "method": "GET",
    "path": "/${apiname}s",
    "handler": "${apiname}.find",
    "config": {
      "policies": []
    }
  },
  {
    "method": "GET",
    "path": "/${apiname}s/count",
    "handler": "${apiname}.count",
    "config": {
      "policies": []
    }
  },
  {
    "method": "GET",
    "path": "/${apiname}s/:id",
    "handler": "${apiname}.findOne",
    "config": {
      "policies": []
    }
  },
  {
    "method": "POST",
    "path": "/${apiname}s",
    "handler": "${apiname}.create",
    "config": {
      "policies": []
    }
  },
  {
    "method": "PUT",
    "path": "/${apiname}s/:id",
    "handler": "${apiname}.update",
    "config": {
      "policies": []
    }
  },
  {
    "method": "DELETE",
    "path": "/${apiname}s/:id",
    "handler": "${apiname}.delete",
    "config": {
      "policies": []
    }
  }
]
}`
 
    fs.writeFileSync("../StrapiAPI/api/"+apiname+"/config/routes.json", data) 

    console.log('Config created successfully!'); 

    fs.mkdirSync("../StrapiAPI/api/"+apiname+"/controllers") 
    
    fs.writeFileSync("../StrapiAPI/api/"+apiname+"/controllers/"+apiname+".js", strContro) 
       
    console.log('controllers created successfully!'); 

    fs.mkdirSync("../StrapiAPI/api/"+apiname+"/models")
     
    fs.writeFileSync("../StrapiAPI/api/"+apiname+"/models/"+apiname+".js", strModels)
    fs.writeFileSync("../StrapiAPI/api/"+apiname+"/models/"+apiname+".settings.json", model)

    fs.mkdirSync("../StrapiAPI/api/"+apiname+"/services")
    fs.writeFileSync("../StrapiAPI/api/"+apiname+"/services/"+apiname+".js", strServices)

    console.log('services created successfully!'); 
    console.log('Directory created successfully!'); 

    var ckeys = Object.keys(req.body["componentes"])
    console.log("componentes: ",req.body["componentes"])

    //var componentes = JSON.stringify(req.body["componentes"][`${ckeys[0]}`], null, 2)
    //var compKeys = Object.keys(req.body["componentes"][`${ckeys[0]}`])
    console.log("ckeys: ",ckeys)
    console.log("ckeys size: ",ckeys.length)

    if(ckeys.length > 0){
      fs.mkdirSync("../StrapiAPI/components/"+apiname) 
      ckeys.forEach(k => {
        var str =  JSON.stringify(req.body["componentes"][`${k}`], null, 2)

        fs.writeFileSync("../StrapiAPI/components/"+apiname+"/"+k+".json", str)        
      });
      console.log('components created successfully!');  
    }
      /*
      fs.writeFileSync("./jsons/"+apiname+".json", dataset) 
      var child = execSync('mongoimport --db StrapiAPI --collection '+apiname+' --file ./jsons/'+apiname+'.json --jsonArray',
        function (error, stdout, stderr) {
          console.log('stdout: ' + stdout);
          console.log('stderr: ' + stderr);
          if (error !== null) {
            console.log('exec error: ' + error);
          }
      });*/
//
    //(async () => {
    ////  var bol = await isReachable('http://localhost:1337/')
    ////  while(!bol){
    ////    bol = await isReachable('http://localhost:1337/')
    ////    console.log("esperando")
    ////  }   
    //  //var t = new Date().getTime(); 
    //  //while (new Date().getTime() < t + 5000);  
    //  console.log("apiname: ",apiname)
    //  for (var key in dataset) {
    //    if (dataset.hasOwnProperty(key)) {
    //      var val = JSON.stringify(dataset[key]);
    //      console.log("val:"+ val)
    //      console.log("iteração:"+val)
    //      
    //     
    //      axios.post('http://localhost:1337/'+apiname+"s", val, {
    //        headers: {
    //            'Content-Type': 'application/json',
    //        }
    //      })
    //      .then(dados => console.log("postado"))
    //      .catch(erro => {
    //        if(erro.toString().includes("connect ECONNREFUSED 127.0.0.1:1337") || erro.toString().includes("read ECONNRESET") || erro.toString().includes("Request failed with status code 405")) {
    //         let tr=false;
    //         console.log("TR = falso cima")
//
    //         while(!tr){
    //          console.log("entrou no while")
    //          axios.post('http://localhost:1337/'+apiname+"s", val, {
    //            headers: {
    //              'Content-Type': 'application/json',
    //            }
    //          })
    //          .then(dados => {
    //            tr=true;
    //            console.log("postado")
    //          })
    //          .catch(erro => {
    //            if(erro.toString().includes("connect ECONNREFUSED 127.0.0.1:1337") || erro.toString().includes("read ECONNRESET") || erro.toString().includes("Request failed with status code 405")) {
    //              tr=false;
    //              console.log("TR = falso baixo")
    //             }
    //            console.log("---------erro no for----------"+erro);
    //          })
    //        }
    //        }
    //        console.log("---------erro no for----------"+erro);
    //      })
//
    //      
    //      
    //    }
//
    //  }
    //})();

    
   
      res.status(200).jsonp("Geração api done!")
      res.end()
    } catch (error) {
      res.status(500).jsonp({error: error})
      console.log("teyy:"+error)
      res.end()
    }

    console.log("geração done!")

  //console.log("req.body :"+ apiname)
  // Sync:
  //try {
  //  fsEx.copySync('../Strapi', '../'+apiname)
  //  console.log('folder criado com success!')
  //} catch (err) {
  //  console.error(err)
  //}

  //fs.mkdir("../api/api/"+apiname, (err) => { 
  //  if (err) { 
  //    console.error(err); 
  //    return res.status(500).jsonp({error: err})
  //  } 
  //  console.log('Directory created successfully!'); 
  //  return res.status(201).jsonp({msg: "Directory created successfully!"})
  //}); 
})   


router.post('/import', function(req, res, next) {
  var apiname = req.body["apiName"]

  var dkeys = Object.keys(req.body["dataset"])
  var dataName = dkeys[0]
  var dataset = req.body["dataset"]
  console.log("dataset: ", dataset)
  function povoar() {
    (async () => {
      var bol = await isReachable('http://strapi:1337/')
      console.log("esperando")
      while(!bol){
        bol = await isReachable('http://strapi:1337/')
      } 
    
    for (var key in dataset) {
      if (dataset.hasOwnProperty(key)) {
        var val = JSON.stringify(dataset[key]);
        console.log("val:"+ val)

        axios.post('http://strapi:1337/'+apiname+"s", val, {
          headers: {
              'Content-Type': 'application/json',
          }
        })
        .then(dados => console.log("postado"))
        .catch(erro => {
          console.log("---------erro no for----------"+erro);
        })
      }
    }  
  })();
  }

  try {
    let pov = setTimeout(povoar, 5500);
    
    res.status(200).jsonp("Import done!")
    res.end()
  } catch (error) {
    res.status(500).jsonp({error: error})
    console.log("teyy:"+error)
    res.end()
  }
})



module.exports = router;
