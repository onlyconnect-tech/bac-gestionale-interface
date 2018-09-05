'use strict';

import Mongo from './lib/mongo';

const Hapi = require('hapi');

const routers = require('./routers');

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



const init = async () => {

    const mongo = new Mongo();

    db = await mongo.getDB(url, dbName);

    // registre mongo e db
    server.bind({db: db, message: 'PIPPO'});

    server.route(routers);

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();