'use strict';

import Mongo from './lib/mongo';

const Hapi = require('hapi');

const mongo = new Mongo();

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
// 'myproject'
const dbName = 'myproject';

var db;

const server = Hapi.server({
    port: 3000,
    host: 'localhost'
});

server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {

        return 'Hello, world!';
    }
});

server.route({
    method: 'GET',
    path: '/{name}',
    handler: (request, h) => {

        return 'Hello, ' + encodeURIComponent(request.params.name) + '!';
    }
});

server.route({
    method: 'GET',
    path: '/anagrafica',
    handler: async (request, h) => {
        
        var responseResults;

        var cur = await mongo.findAnagrafiche(db);
        
        responseResults = cur.toArray();
        return responseResults;
    }
});

server.route({
    method: 'GET',
    path: '/delete-anagrafica',
    handler: async (request, h) => {
        
        var responseResults;

        try {
          await mongo.deleteAnagrafiche(db);
        
          return {OP: 'delete-anagrafica', RESULT: 'OK'};
        } catch(e) {
            return {OP: 'delete-anagrafica', RESULT: 'ERROR'};
        }
    }
});

server.route({
    method: 'GET',
    path: '/last-anagrafica',
    handler: async (request, h) => {
        
        return { sequenceNumber: 1};
    }
});

server.route({
    method: 'GET',
    path: '/get-anagrafica/{ids}',
    handler: async (request, h) => {
        
        var responseResults;

        // find id-values

        var ids = request.params.ids;

        var arrIds = ids.split('-');

        console.log('SEARCHING INFO:', arrIds);

        return Promise.all(arrIds.map((sequenceNumber) => {
            console.log('***', sequenceNumber);

            var p = mongo.findAnagraficheBySequenceNumber(db, parseInt(sequenceNumber));
            
            return p;
        }));
        
    }
});


const init = async () => {
    db = await mongo.getDB(url, dbName);

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();