import Parser from 'node-dbf';
import {
    Observable
} from "rxjs/Observable";

import ParsingRecordError from "./exceptions/ParsingRecordError";

const logger = require('./config/winston.js');

import Mongo from './lib/mongo';

async function doProcessBlockRecords(mongo, dbMongo, recordsBlock) {

    return Promise.all(recordsBlock.map((record) => {
        return doInsertRecord(mongo, dbMongo, record).then((result) => {
            return result;
        }, (err) => {
            console.log("ERROR INSERTING FATTURA:", err.message, "- SEQUENCE NUMBER:", record['@sequenceNumber']);
            return Promise.reject(err);
        });

    }));
}

async function doInsertRecord(mongo, db, record) {

    var isDeleted = record['@deleted'];
    var sequenceNumber = record['@sequenceNumber'];

    logger.debug('--> sequenceNumber: %d . isDeleted: %s', sequenceNumber, isDeleted);

    if (record.CLFR === 'F') {

        return {
            op: 'INVALID_TYPE',
            anagraficaId: -1
        };
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
        const message = `INVALID RECORD: ${sequenceNumber}, error parsing - codiceCliente: \'${info.codiceCli}\'`
        logger.warn(message);
        return {
            op: 'INVALID_PARSING',
            anagraficaId: -1
        };
    }

    logger.debug('----> inserting - codCli: %d, ragSoc: %s, sedeLeg: %s, codFisc: %s, pIva: %s', info.codiceCli, ragSoc, info.indSedeLeg, info.codiceFisc, info.pIva);

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

        const restInsertAnagrafica = await mongo.insertOrUpdateAnagrafica(db, anagrafica);

        logger.log('debug', "SYNC ANAG:", restInsertAnagrafica);

        // if op === 'INSERT' add to sync operations
        // if op === 'UPDATE' add to sync operations
        // if op === 'NONE' no need sync operations

        return restInsertAnagrafica;

    } catch (err) {

        console.log("ERROR INSERT ANAGRAFICA:", err.message, "- SEQUENCE NUMBER:", record['@sequenceNumber']);
        throw err;

    }

}


class SynchronizerAnagrafica {

    constructor(fileName, urlManogoDb, dbName) {
        this.fileName = fileName;
        this.urlManogoDb = urlManogoDb;
        this.dbName = dbName;
        this.numRow = 0;
    }

    doWork() {

        return new Promise((resolve, reject) => {
                const parser = new Parser(this.fileName);

                const mongo = new Mongo();

                var dbMongo;

                var observerG;

                var accumulatorRecords = [];

                var observable = Observable.create(function subscribe(observer) {
                    observerG = observer;
                });

                observable.subscribe(async (record) => {
                    const splitLength = 500;
                    accumulatorRecords.push(record);
                    if (accumulatorRecords.length == splitLength) {
                        const recordsBlock = accumulatorRecords;

                        accumulatorRecords = [];
                        // call insert block

                        try {
                            var results = await doProcessBlockRecords(mongo, dbMongo, recordsBlock);
                            console.log("+++++++", results);
                        } catch (errs) {
                            // skip other processing
                            console.log("*********", errs.message);
                        }

                    }


                }, (err) => {

                    console.log("ERROR:", err);

                    /*
                        
                        */

                }, async () => {
                    // done

                    // process last
                    try {
                        var results = await doProcessBlockRecords(mongo, dbMongo, accumulatorRecords);
                        console.log("+++++++", results);
                    } catch (errs) {
                        console.log("*********", errs.message);
                    } finally {
                        console.log('COMPLETE REACHED!!!');

                        mongo.closeClient();

                        console.log('CLOSED CLIENT!!!');

                        resolve({
                            status: "OK",
                            numRow: this.numRow
                        });
                    }
                });

                logger.log('info', 'test message %s', 'my string');

                mongo.getDB(this.urlManogoDb, this.dbName).then((db) => {
                    dbMongo = db;

                    parser.on('start', (p) => {
                        console.log('dBase file parsing has started');
                    });

                    parser.on('header', (h) => {
                        console.log('dBase file header has been parsed' + JSON.stringify(h));
                    });

                    parser.on('record', (record) => {
                        this.numRow++;
                        //console.log( JSON.stringify(record)); 
                        observerG.next(record);
                    });

                    parser.on('end', (p) => {
                        console.log('Finished parsing the dBase file - numRow: ' + this.numRow);
                        observerG.complete();
                    });

                    parser.parse();

                }, (err) => {
                    console.log("ERROR:", err);
                });

            }); // close promise

        } // fine doWork

    }

    module.exports = SynchronizerAnagrafica;