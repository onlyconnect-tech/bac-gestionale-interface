import Parser from 'node-dbf';
import {
    Observable
} from "rxjs/Observable";

const Promise = require('bluebird');
const moment = require('moment');
const Logger = require('./config/winston.js');

const logger = new Logger('MG_ANAGRAFICA');

import Mongo from './lib/mongo';

async function doProcessBlockRecords(mongo, recordsBlock) {
    
    var current = Promise.resolve();

    return Promise.all(recordsBlock.map((record) => {

        current = current.then(async function() {
            return await doInsertRecord(mongo, record); // returns promise
        }).then(function(result) { 
            logger.info(" RESULT BLOCKKK: %j", result);
            return result;
        }, function(err) {
            logger.error("ERROR RESULT BLOCKKK: %s", err);
            return Promise.reject(err);
        });

        return current;
        
        /*
        return doInsertRecord(mongo, record).then((result) => {
            return result;
        });
        */

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
        dataIns: record.DATINS,
        dataUMOD: record.DATUMOD,
        cap: record.CAP,
        localita: record.LOCAL,
        prov: record.PROV
    };


    let ragSoc = info.ragSoc;
    if (info.ragSoc2) {
        ragSoc = ragSoc + ' - ' + info.ragSoc2;
    }

    if (isNaN(info.codiceCli)) {
        logger.warn(`INVALID RECORD: ${sequenceNumber}, error parsing - codiceCliente: \'${info.codiceCli}\'`);
        return {
            op: 'INVALID_PARSING',
            anagraficaId: -1
        };
    }

    logger.info('----> CHECK ANAGRAFICA - sequenceNumber: %d, codCli: %d', sequenceNumber, info.codiceCli);

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
            dataIns: moment(info.dataIns, "YYYYMMDD").toDate(),
            dataUMOD: moment(info.dataUMOD, "YYYYMMDD").toDate(),
            location: location
        };

        const restInsertAnagrafica = await mongo.insertOrUpdateAnagrafica(anagrafica);

        // if(restInsertAnagrafica.op !== 'NONE')
            logger.info("SYNC ANAG: %j", restInsertAnagrafica);

        // if op === 'INSERT' add to sync operations
        // if op === 'UPDATE' add to sync operations
        // if op === 'NONE' no need sync operations

        return restInsertAnagrafica;

    } catch (err) {
        logger.error("ERROR INSERT ANAGRAFICA: %s - SEQUENCE NUMBER: %d",  err.message, record['@sequenceNumber']);
        throw err;
    }

}


class SynchronizerAnagrafica {

    constructor(fileName, urlManogoDb, dbName) {
        this.fileName = fileName;
        this.urlManogoDb = urlManogoDb;
        this.dbName = dbName;

        this.arrPromisesBlocksProcessing = [];
        this.numRow = 0;
    }

    doWork() {
        
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

                        var resultsP = doProcessBlockRecords(mongo, recordsBlock);

                        this.arrPromisesBlocksProcessing.push(resultsP);

                        /*

                        try {
                            var results = await doProcessBlockRecords(mongo, recordsBlock);
                            logger.info("*** BLOCK ANAGRAFICHE PROCESSED");
                        } catch (errs) {
                            numErrors ++;
                            // skip other processing
                            logger.error("ERROR: %s", errs.message);
                        }

                        */

                    }


                }, (err) => {

                    logger.error("%s", err);

                    /*
                        
                        */

                }, async () => {
                    // done

                    logger.info("PROCESSING LAST BLOCK!!!");

                    var resultsP = doProcessBlockRecords(mongo, accumulatorRecords);

                    this.arrPromisesBlocksProcessing.push(resultsP);

                    Promise.all(this.arrPromisesBlocksProcessing).then((results)=> {

                        logger.info('LAST: %O', results);

                        resolve({
                            status: "OK",
                            numRow: this.numRow
                        });

                    }, (err) => {
                        
                        logger.error("LAST: %s", err);

                        return resolve({
                            status: "ERROR",
                            numRow: this.numRow,
                            numErrors: numErrors
                        }); 

                    }).finally(()=> {

                       logger.info('COMPLETE REACHED - IN FINALLY!!!');

                       mongo.closeClient();

                       this.numRow = 0;

                       this.arrPromisesBlocksProcessing = [];
                    });


                    // process last

                    /*

                    try {
                        var results = await doProcessBlockRecords(mongo, accumulatorRecords);
                        logger.debug("BLOCK ANAGRAFICHE PROCESSED");
                    } catch (errs) {
                        numErrors++;

                        logger.error("ERROR: %s", errs.message);
                    } finally {
                        logger.info('COMPLETE REACHED!!!');

//                         mongo.closeClient();

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

                    */
                });

                mongo.initDBConnection().then(() => {

                    parser.on('start', (p) => {
                        logger.info('dBase file %s parsing has started', this.fileName);
                    });

                    parser.on('header', (h) => { 
                        logger.info('dBase file %s header has been parsed %j', this.fileName, h);
                    });

                    parser.on('record', (record) => {
                        this.numRow++;
                        //console.log( JSON.stringify(record)); 
                        observerG.next(record);
                    });

                    parser.on('end', (p) => {
                        logger.info('Finished parsing the dBase file %s - numRow: %d', this.fileName, this.numRow);
                        observerG.complete();
                    });

                    parser.parse();

                }, (err) => {
                    logger.error("ERROR: %s", err);
                    reject(err);
                });

            }); // close promise

        } // fine doWork

    }

    module.exports = SynchronizerAnagrafica;