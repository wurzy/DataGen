var express = require('express');
var router = express.Router();
const fs = require("fs")
const AdmZip = require('adm-zip')
const axios = require('axios')
const isReachable = require('is-reachable');
var rimraf = require("rimraf");

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://mongo:27017/LEI2021";

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
router.get('/collections', function(req, res, next) {
  fs.readdir("./shared/api/", (err, files) => { 
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
      if(fs.existsSync('./shared/components/'+req.params.name)){
        fs.readdirSync('./shared/components/'+req.params.name).forEach(file => {
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

      if(fs.existsSync('./shared/api/'+req.params.name)){rimraf.sync("./shared/api/"+req.params.name);}

      if(fs.existsSync('./shared/components/'+req.params.name)){rimraf.sync('./shared/components/'+req.params.name); }

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
    let ok = false
    var zip = AdmZip('./utils/Strapi.zip');
    if (fs.existsSync('./shared/api/'+req.params.id)) {
      ok = true
      fs.readdirSync('./shared/api/'+req.params.id).forEach(folder => {
        fs.readdirSync('./shared/api/'+req.params.id+"/"+folder).forEach(file=>{
          zip.addLocalFile('./shared/api/'+req.params.id+"/"+folder+"/"+file, '/Strapi/api/'+req.params.id+"/"+folder)
        })
      })
    }
    if(fs.existsSync('./shared/components/'+req.params.id)){
      ok = true
      fs.readdirSync('./shared/components/'+req.params.id).forEach(file => {
        zip.addLocalFile('./shared/components/'+req.params.id +"/"+file, "/Strapi/components/"+req.params.id)
      })
    }
    if(ok){
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${req.params.id}.zip`,
      })
      res.write(zip.toBuffer())
      res.end()
    }
  }
  catch(error){
    console.log(error)
  }
})

router.post('/genAPI', function(req, res, next) {
  var apiname = req.body["apiName"]
  var model = JSON.stringify(req.body["model"], null, 2)
  console.log("apiname: ",apiname)
  console.log("model. ",req.body["model"])
  
  try {
    fs.mkdirSync("./shared/api/"+apiname) 

    fs.mkdirSync("./shared/api/"+apiname+"/config")
  
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
 
    fs.writeFileSync("./shared/api/"+apiname+"/config/routes.json", data) 

    console.log('Config created successfully!'); 

    fs.mkdirSync("./shared/api/"+apiname+"/controllers") 
    
    fs.writeFileSync("./shared/api/"+apiname+"/controllers/"+apiname+".js", strContro) 
       
    console.log('controllers created successfully!'); 

    fs.mkdirSync("./shared/api/"+apiname+"/models")
     
    fs.writeFileSync("./shared/api/"+apiname+"/models/"+apiname+".js", strModels)
    fs.writeFileSync("./shared/api/"+apiname+"/models/"+apiname+".settings.json", model)

    fs.mkdirSync("./shared/api/"+apiname+"/services")
    fs.writeFileSync("./shared/api/"+apiname+"/services/"+apiname+".js", strServices)

    console.log('services created successfully!'); 
    console.log('Directory created successfully!'); 

    var ckeys = Object.keys(req.body["componentes"])
    console.log("componentes: ",req.body["componentes"])

    console.log("ckeys: ",ckeys)
    console.log("ckeys size: ",ckeys.length)

    if(ckeys.length > 0){
      fs.mkdirSync("./shared/components/"+apiname) 
      ckeys.forEach(k => {
        var str =  JSON.stringify(req.body["componentes"][`${k}`], null, 2)

        fs.writeFileSync("./shared/components/"+apiname+"/"+k+".json", str)        
      });
      console.log('components created successfully!');  
    }
      res.status(200).jsonp("Geração api done!")
      res.end()
      
    } catch (error) {
      res.status(500).jsonp({error: error})
      console.log("teyy:"+error)
      res.end()
    }

    console.log("geração done!")
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
          console.log("---------erro no for----------"+JSON.stringify(erro.response.data.data));
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