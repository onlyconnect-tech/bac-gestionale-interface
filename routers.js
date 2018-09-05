'use strict';

import Mongo from './lib/mongo';

const mongo = new Mongo();

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

        var cur = await mongo.findAnagrafiche(this.db);
        
        responseResults = cur.toArray();
        return responseResults;
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
        
        return { sequenceNumber: 1};
    }
}, {
    method: 'GET',
    path: '/get-anagrafica/{ids}',
    handler: async function (request, h) {
        
        var responseResults;

        // find id-values

        var ids = request.params.ids;

        var arrIds = ids.split('-');

        console.log('SEARCHING INFO:', arrIds);

        return Promise.all(arrIds.map((sequenceNumber) => {
            console.log('***', sequenceNumber);

            var p = mongo.findAnagraficheBySequenceNumber(this.db, parseInt(sequenceNumber));
            
            return p;
        }));
        
    }
}];


module.exports = routes;