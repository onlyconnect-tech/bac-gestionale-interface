import Parser from 'node-dbf';
import {
    Observable
} from "rxjs/Observable";

const logger = require('./config/winston.js');

import Mongo from './lib/mongo';

async function doProcessBlockRecords(mongo, recordsBlock) {

    return Promise.all(recordsBlock.map((record) => {
        return doInsertRecord(mongo, record).then((result) => {
            return result;
        });

    }));
}

async function doInsertRecord(mongo, record) {

    var isDeleted = record['@deleted'];
    var sequenceNumber = record['@sequenceNumber'];

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

    logger.debug('----> CHECK ANAGRAFICA - sequenceNumber: %d, codCli: %d', sequenceNumber, info.codiceCli);

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
            _id: sequenceNumber,
            isDeleted: isDeleted,
            codiceCli: info.codiceCli,
            ragSoc: ragSoc,
            indSedeLeg: info.indSedeLeg,
            codiceFisc: info.codiceFisc,
            pIva: info.pIva,
            location: location
        };

        const restInsertAnagrafica = await mongo.insertOrUpdateAnagrafica(anagrafica);

        if(restInsertAnagrafica.op !== 'NONE')
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
        this.numRow = 0; // reset 
        return new Promise((resolve, reject) => {
                const parser = new Parser(this.fileName);

                const mongo = new Mongo(this.urlManogoDb, this.dbName);

                var observerG;

                var accumulatorRecords = [];
                var numErrors = 0;

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
                            var results = await doProcessBlockRecords(mongo, recordsBlock);
                            console.log("BLOCK ANAGRAFICHE PROCESSED");
                        } catch (errs) {
                            numErrors ++;
                            // skip other processing
                            console.log("ERROR:", errs.message);
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
                        var results = await doProcessBlockRecords(mongo, accumulatorRecords);
                        console.log("BLOCK ANAGRAFICHE PROCESSED");
                    } catch (errs) {
                        numErrors++;

                        console.log("ERROR:", errs.message);
                    } finally {
                        console.log('COMPLETE REACHED!!!');

                        mongo.closeClient();

                        console.log('CLOSED CLIENT!!!');

                        if ( numErrors !== 0) {
                            return resolve({
                                status: "ERROR",
                                numRow: this.numRow,
                                numErrors: numErrors
                            }); 
                        } 

                        resolve({
                            status: "OK",
                            numRow: this.numRow
                        });
                    }
                });

                logger.log('info', 'test message %s', 'my string');

                mongo.initDBConnection().then(() => {

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
                    reject(err);
                });

            }); // close promise

        } // fine doWork

    }

    module.exports = SynchronizerAnagrafica;