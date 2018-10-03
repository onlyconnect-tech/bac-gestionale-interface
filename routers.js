'use strict';

const Joi = require('joi');
const Bounce = require('bounce');
const Promise = require('bluebird');

const handleError = function (request, h, err) {

    /*
    if (err.isJoi && Array.isArray(err.details) && err.details.length > 0) {
        const invalidItem = err.details[0];
        return h.response(`Data Validation Error. Schema violation. <${invalidItem.path}> \nDetails: ${JSON.stringify(err.details)}`)
            .code(400)
            .takeover();
    }

    return h.response(err)
        .takeover()
    */
   console.log(JSON.stringify(err));
   throw err;
};

const routes = [{
    method: 'GET',
    path: '/',
    handler: function (request, h) {
        return 'Hello, world!';
    }
}, {
    method: 'GET',
    path: '/{name}',
    handler: function (request, h) {
        
        return 'Hello, ' + encodeURIComponent(request.params.name) + '!';
    }
}, {
    method: 'GET',
    path: '/anagrafica',
    handler: async function (request, h) {
        
        const mongo = this.mongo;
                
        var  res;
        
        try {
            res = await mongo.findAnagrafica();
        
        } catch (err) {
            // res = "CUNARDO!!";
            console.log("ERR:", err);
            Bounce.rethrow(err, 'system');
        }

        console.log("res --->");
 
        return res;
    }
}, {
    method: 'GET',
    path: '/delete-anagrafica',
    handler: async function (request, h) {
        
        const mongo = this.mongo;

        try {
          await mongo.deleteAnagrafiche();
        
          return {OP: 'delete-anagrafica', RESULT: 'OK'};
        } catch(e) {
            return {OP: 'delete-anagrafica', RESULT: 'ERROR'};
        }
    }
}, {
    method: 'GET',
    path: '/last-anagrafica',
    handler: async function (request, h) {
        
        const mongo = this.mongo;

        return mongo.findLastAnagrafichaNumber();
    }
}, {
    method: 'GET',
    path: '/get-anagrafica/{ids}',
    handler: async function (request, h) {

        const mongo = this.mongo;
        
        // find id-values

        var ids = request.params.ids;

        var arrIds = ids.split('-');
         
        console.log(arrIds);

        const schema = Joi.array().items(Joi.number());

        return new Promise(function (resolve, reject) {

            Joi.validate(arrIds, schema, (err, value) => { 

                if(err) {
                    console.log(err);
                    return reject(err);
                }
                
                console.log(value);
                
                resolve(value);
   
            });
     
        }).then(function(values) {
            return Promise.all(values.map((sequenceNumber) => {

                var p = mongo.findAnagraficheBySequenceNumber(parseInt(sequenceNumber));
                
                return p;
            }));
        }, function (err) {
            return err;
        });
    }
}, {
    method: 'GET',
    path: '/get-anagrafica-elem/{id}',
    options: {
        validate: {
            params: {
                id: Joi.number()
            },
            failAction: handleError
        }
    }, 
    handler: async function (request, h) {
        
        const mongo = this.mongo;

        // find id-values

        var id = request.params.id;

        return mongo.findAnagraficheBySequenceNumber(id);
        
        }
    }, {
        method: 'GET',
        path: '/get-anagrafica-by-codcli/{codcli}',
        handler: async function (request, h) {
            
            const mongo = this.mongo;
    
            // find id-values
    
            var codcli = request.params.codcli;
    
            return mongo.findAnagraficheByCodCli(codcli);
            
            }
        }, {  
        method: 'GET',
        path: '/add',
        handler: async (request, h) => {

          let server = request.server;
          let result = null;
          try {
            result = await server.methods.add(1, 2);
            return result;
          } catch (err) {
            // console.log(err);
            // throw err;
            // return "ERROR";
            Bounce.rethrow(err, 'system');
          }
          return result;
        }
      }, {
          method: 'GET',
          path: '/location',
          handler: async function (request, h){

            const mongo = this.mongo;
            var locations;
            try {
                locations = await mongo.findLocation().toArray();
            } catch(err) {
               console.log("", err);
               Bounce.rethrow(err, 'system');
            }

            return locations;
          }
      }, {
        method: 'GET',
        path: '/get-anagrafica-by-location/{location}',
        handler: async function (request, h){
          const mongo = this.mongo;
          
          var locationName = request.params.location;

          console.log('GET BY LOCATION:', locationName);

          var results;

          try {
            results = await mongo.getAnagraficaByLocation(locationName);
          } catch(err) {
            console.log("", err);
            Bounce.rethrow(err, 'system');
          }
          
          return results;
        }
    }, {
        method: 'GET',
        path: '/fatture',
        handler: async function (request, h) {
            
            const mongo = this.mongo;
                    
            var  res;
            
            try {
                res = await mongo.findFatture();
            
            } catch (err) {
                // res = "CUNARDO!!";
                console.log("ERR:", err);
                Bounce.rethrow(err, 'system');
            }

            console.log("res --->");
    
            return res;
        }
    }, {
        method: 'GET',
        path: '/fatture-by-codcli/{codCli}',
        handler: async function (request, h) {
            
            const mongo = this.mongo;
            
            var codCli = request.params.codCli;
            
            var  res;
            
            try {
                res = await mongo.findFattureByCodCli(codCli);
            
            } catch (err) {
                // res = "CUNARDO!!";
                console.log("ERR:", err);
                Bounce.rethrow(err, 'system');
            }

            console.log("res --->");
    
            return res;
        }
    }
];


module.exports = routes;