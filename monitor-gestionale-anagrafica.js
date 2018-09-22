import Parser from 'node-dbf';
import {
    Observable
} from "rxjs/Observable";

const logger = require('./config/winston.js');

import Mongo from './lib/mongo';

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
// 'myproject'
const dbName = 'myproject';

var numRow = 0;
let parser = new Parser('./data/ANACF.DBF');

const mongo = new Mongo();

var dbMongo;

var observerG;

var observable = Observable.create(function subscribe(observer) {
    observerG = observer;
});

observable.subscribe((record) => {

    return doInsertRecord(dbMongo, record).then((result) => {

    }, (err) => {
        console.log("ERROR INSERTING:", err);
    });

}, (err) => {

    console.log(err);

}, () => {

    console.log('COMPLETE REACHED!!!');

    mongo.closeClient();

    console.log('CLOSED CLIENT!!!');
});

logger.log('info', 'test message %s', 'my string');

mongo.getDB(url, dbName).then((db) => {
    dbMongo = db;

    parser.on('start', (p) => {
        console.log('dBase file parsing has started');
    });

    parser.on('header', (h) => {
        console.log('dBase file header has been parsed' + JSON.stringify(h));
    });

    parser.on('record', (record) => {
        numRow++;
        //console.log( JSON.stringify(record)); 
        observerG.next(record);
    });

    parser.on('end', (p) => {
        console.log('Finished parsing the dBase file - numRow: ' + numRow);
        observerG.complete();
    });

    parser.parse();

}, (err) => {
    console.log("ERROR:", err);
});

// @deprecated
async function doInsertWork() {

    const mongo = new Mongo();

    /*
      records.map( record => {
          console.log("********* ", record);
      });
      */

    // start with current being an "empty" already-fulfilled promise
    try {
        const db = await mongo.getDB(url, dbName);

        var current = Promise.resolve();

        await Promise.all(records.map(function (record) {

            current = current.then(async function () {
                try {
                    var p = await doInsertRecord(db, record); // returns promise
                    return p;
                } catch (e) {
                    logger.error("QQQQ", e);
                    return Promise.reject();
                }
            }).catch(function (err) {
                logger.error(err, ' --> ', record);
            });

            return current;
        }));

        mongo.closeClient();
    } catch (e) {
        logger.log('error', "%j", e);
    }


}

async function doInsertRecord(db, record) {

    return new Promise(async function (resolve, reject) {

        var isDeleted = record['@deleted'];
        var sequenceNumber = record['@sequenceNumber'];

        logger.debug('--> sequenceNumber: %d . isDeleted: %s', sequenceNumber, isDeleted);

        if (record.CLFR === 'F') {

            return resolve();
        }

        const info = {
            codiceCli: record.CODCF,
            ragSoc: record.RAGSOC,
            indSedeLeg: record.INDIR,
            ragSoc2: record.RAGSOC2,
            codiceFisc: record.CODFISC,
            pIva: record.PARTIVA,
            cap: record.CAP,
            localita: record.LOCAL,
            prov: record.PROV
        };


        let ragSoc = info.ragSoc;
        if (info.ragSoc2) {
            ragSoc = ragSoc + ' - ' + info.ragSoc2;
        }



        if (isNaN(info.codiceCli)) {
            logger.warn('INVALID RECORD:', record);
            return reject(new Error('INVALID RECORD: ' + record));
        }

        logger.debug('----> inserting - codCli: %d, ragSoc: %s, sedeLeg: %s, codFisc: %s, pIva: %s', info.codiceCli, ragSoc, info.indSedeLeg, info.codiceFisc, info.pIva);

        var mongo = new Mongo();

        // info.localita, info.cap, info.prov
        var location = {
            localita: info.localita,
            cap: info.cap,
            prov: info.prov
        };

        try {

            // if op === 'INSERTED' add to sync operations
            // if op === 'NONE' no need sync operations

            var anagrafica = {
                sequenceNumber: sequenceNumber,
                isDeleted: isDeleted,
                codiceCli: info.codiceCli,
                ragSoc: ragSoc,
                indSedeLeg: info.indSedeLeg,
                codiceFisc: info.codiceFisc,
                pIva: info.pIva,
                location: location
            };

            const restInsertAnagrafica = await mongo.doInsertAnagrafica(db, anagrafica);

            logger.log('debug', "SYNC ANAG:", restInsertAnagrafica);

            // if op === 'INSERT' add to sync operations
            // if op === 'UPDATE' add to sync operations
            // if op === 'NONE' no need sync operations




        } catch (err) {
            logger.log('error', "%s", err);
            console.log(err);
        }

        resolve();


    });

}