'use strict';
require = require('esm')(module/*, options*/);

const Cache = require('../lib/cache').Cache;

const argv = require('yargs')
    .usage('Usage: $0 -d [ANAGRAFICA|] \n e.g $0 -d ANAGRAFICA')
    .alias('d', 'delete')
    .nargs('d', 1)
    .describe('d', 'Delete collection')
    .choices('d', ['ANAGRAFICA', 'INVOICES', 'INVOICES-PART'])
    .demandOption(['d'])
    .default('p', './cache_db/gestionale-db')
    .alias('p', 'path')
    .describe('p', 'Path db cache')
    .help('h')
    .alias('h', 'help')
    .epilog('Copyright OnlyConnect 2018')
    .argv;


const cleanAnagrafica = async (pathDBCache)=> {

    try {
        const cache = new Cache(pathDBCache);
        
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

    } catch(err) {
        console.log('************************');
        console.log(err);
        console.log('************************');
    }
};

const cleanInvoices = async (pathDBCache)=> {

    try {
        const cache = new Cache(pathDBCache);
        
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

    } catch(err) {
        console.log('************************');
        console.log(err);
        console.log('************************');
    }
};

const cleanInvoicesPart = async (pathDBCache)=> {

    try {
        const cache = new Cache(pathDBCache);
        
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

    } catch(err) {
        console.log('************************');
        console.log(err);
        console.log('************************');
    }
}

console.log('Path db cache:', argv.p);

if(argv.d === 'ANAGRAFICA') {
    console.log('DELETING ANAGRAFICA');

    cleanAnagrafica(argv.p);

} else if(argv.d === 'INVOICES') {
    console.log('DELETING INVOICES');

    cleanInvoices(argv.p);

} else if(argv.d === 'INVOICES-PART') {
    console.log('DELETING INVOICES-PART');

    cleanInvoicesPart(argv.p);
} 



