const products = [
    {
        "sku": 1,
        "name":"sillón 3 cuerpos",
        "categories":["sillon", "sofa", "muebles", "living", "cuero"],
        "description": "Hermoso sillón de cuero de 3 cuerpos",
    },{
         "sku": 2,
        "name":"sillón 2 cuerpos",
        "categories":["sillon", "sofa", "muebles", "living", "ecocuero"],
        "description": "Hermoso sillón de cuero de 2 cuerpos",
    },{
         "sku": 3,
        "name":"Mesa de comedor redonda de vidrio",
        "categories":["mesa", "comedor", "muebles", "vidrio"],
        "description": "Moderna mesa de 110 cm de radio",
    },{
        "sku": 4,
        "name":"cama matimonial",
        "categories":["cama", "muebles", "bed"],
        "description": "Hermosa cama matrimonial de madera de pino",
    }
];


const express = require('express');

const router = express.Router();

const elastic = require('elasticsearch');
const { json } = require('express');

const bodyParser = require('body-parser').json();

const elasticClient = elastic.Client({
    host:'localhost:9200',
})

router.use((req, res, next) => {
    elasticClient.index({
        index: 'logs',
        body: {
            url: req.url,
            method: req.method
        }
    })
    .then( resp => {
        console.log( 'Logs indexed ',resp);
    })
    .catch(err => {
        console.log(err);
    })
    next();
});

router.post('/products', bodyParser, (req, res) => {
    console.log(req.body);
    elasticClient.index ({
        index: 'products',
        body:req.body
    })
    .then(resp => {
        return res.status(200).json({
            msg:'product indexed',
            resp
        })
    })
    .catch(err => {
        return res.status(500).json({
            msg: `Error: ${err}`,
            err
        })
    })
});

router.get('/products/:id', (req, res) => {
    let query = {
        index: 'products',
        id: req.params.id
    }
    elasticClient.get(query)
    .then(resp => {
        if(!resp) {
            return res.status(404).json({
                products:resp
            });
        }
        return res.status(200).json({
            products:resp
        });
    })
    .catch(err => {
        return res.status(500).json({
            msg: 'Error not found',
            err
        });
    });
});

router.get('/products', (req,res) => {
    let query = {
        index: 'products'
    }
    if(req.query.product) query.q = `*${req.query.product}`;
    elasticClient.search(query)
    .then(resp => {
        return res.status(200).json({
            products:resp.hits.hits
        });
    })
    .catch( err => {
        console.log(err);
        return res.status(500).json({
            msg:'Error',
            err
        })
    })
});

router.put('/products/:id', bodyParser, (req, res) => {
    console.log(req.body);

    elasticClient.update({
        index:'products',
        id: req.params.id,
        body: {
            doc:req.body
        }
    })
    .then(resp => {
        return res.status(200).json({
            msg: 'product updated',
            resp
        });
    })
    .catch( err =>{
        return res.status(500).json({
            msg:'Error',
            err
        }) 
    })
})

module.exports = router;
