'use strict';

const Cache = require('../lib/cache').Cache;

const cleanAnagrafica = async ()=> {

    try {
        const cache = new Cache('./cache_db/gestionale-db-test');
        
        const db = cache.db;

        db.createReadStream({ gte: 'anagrafica:', lt: 'anagraficb:'})
            .on('data', async function (data) {
                console.log(data.key, '=', data.value);
                await db.del(data.key);
            })
            .on('error', function (err) {
                console.log('Oh my!', err);
            })
            .on('close', function () {
                console.log('Stream closed');
            })
            .on('end', function () {
                console.log('Stream ended');

                console.log('ON DB CLOSE!!!');
                db.close();
            });

            // invoice:

            // invoice-part: 

        // await cache.close();

        // setInterval(()=> {}, 100);

    } catch(err) {
        console.log('************************');
        console.log(err);
        console.log('************************');
    }
};

const cleanInvoices = async ()=> {

    try {
        const cache = new Cache('./cache_db/gestionale-db');
        
        const db = cache.db;

        db.createReadStream({ gte: 'invoice:', lt: 'invoicf:'})
            .on('data', async function (data) {
                console.log(data.key, '=', data.value);
                await db.del(data.key);
            })
            .on('error', function (err) {
                console.log('Oh my!', err);
            })
            .on('close', function () {
                console.log('Stream closed');
            })
            .on('end', function () {
                console.log('Stream ended');

                console.log('ON DB CLOSE!!!');
                db.close();
            });

            // invoice:

            // invoice-part: 

        // await cache.close();

        // setInterval(()=> {}, 100);

    } catch(err) {
        console.log('************************');
        console.log(err);
        console.log('************************');
    }
};

const cleanInvoicesPart = async ()=> {

    try {
        const cache = new Cache('./cache_db/gestionale-db');
        
        const db = cache.db;

        db.createReadStream({ gte: 'invoice-part:', lt: 'invoice-paru:'})
            .on('data', async function (data) {
                console.log(data.key, '=', data.value);
                await db.del(data.key);
            })
            .on('error', function (err) {
                console.log('Oh my!', err);
            })
            .on('close', function () {
                console.log('Stream closed');
            })
            .on('end', function () {
                console.log('Stream ended');

                console.log('ON DB CLOSE!!!');
                db.close();
            });

            // invoice:

            // invoice-part: 

        // await cache.close();

        // setInterval(()=> {}, 100);

    } catch(err) {
        console.log('************************');
        console.log(err);
        console.log('************************');
    }
}

cleanInvoicesPart();

