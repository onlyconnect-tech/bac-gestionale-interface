'use strict';

const Joi = require('joi');
const Bounce = require('bounce');
const Promise = require('bluebird');

import Mongo from './lib/mongo';

const mongo = new Mongo();

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
        
        var responseResults;
        
        var  res = await mongo.findAnagrafica(this.db);

        console.log("res --->");
 
        return res;
    }
}, {
    method: 'GET',
    path: '/delete-anagrafica',
    handler: async function (request, h) {
        
        var responseResults;

        try {
          await mongo.deleteAnagrafiche(this.db);
        
          return {OP: 'delete-anagrafica', RESULT: 'OK'};
        } catch(e) {
            return {OP: 'delete-anagrafica', RESULT: 'ERROR'};
        }
    }
}, {
    method: 'GET',
    path: '/last-anagrafica',
    handler: async function (request, h) {
                
        return mongo.findLastAnagrafichaNumber(this.db);
    }
}, {
    method: 'GET',
    path: '/get-anagrafica/{ids}',
    handler: async function (request, h) {

        var db = this.db;
        
        var responseResults;

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

                var p = mongo.findAnagraficheBySequenceNumber(db, parseInt(sequenceNumber));
                
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
        
        var responseResults;

        // find id-values

        var id = request.params.id;

        return mongo.findAnagraficheBySequenceNumber(this.db, id);
        
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

            return mongo.findLocation(this.db).toArray();
          }
      }, {
        method: 'GET',
        path: '/group-anagrafica-by-location',
        handler: async function (request, h){

          return mongo.groupAnagraficaByLocations(this.db);
        }
    }, {
        method: 'GET',
        path: '/get-anagrafica-by-location/{location}',
        handler: async function (request, h){
          var locationName = request.params.location;

          console.log('GET BY LOCATION:', locationName);
          
          return mongo.getAnagraficaByLocation(this.db, locationName);
        }
    }

];


module.exports = routes;