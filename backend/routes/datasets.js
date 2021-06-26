const express = require('express');
const router = express.Router();
const datasetAPI = require('../data/API')

router.get('/:dataset', function(req,res){
    let ds = req.params.dataset
    try{
        let dataset = datasetAPI[ds].get()
        res.status(200).jsonp(dataset)
    }   
    catch(err){
        res.status(404).jsonp(err)
    }
})

module.exports = router;