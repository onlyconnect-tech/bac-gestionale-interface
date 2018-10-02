import Parser from 'node-dbf';
import {
    Observable
} from "rxjs/Observable";

const Logger = require('./config/winston.js');
const moment = require('moment');

const logger = new Logger('MG_FATTURE');

import Mongo from './lib/mongo';

async function doProcessBlockRecords(mongo, recordsBlock) {

    return Promise.all(recordsBlock.map((record) => {
        return doInsertRecord(mongo, record).then((result) => {
            return result;
        });

    }));
}

async function doInsertRecord(mongo, record) {
    var seqNumberGest = record['@sequenceNumber'];
    var idFattura = record.NUMDOC;
    var annDoc = record.ANNDOC;
    var datDoc = moment(record.DATDOC, 'YYYYMMDD').toDate();
    var codCliente = record.CODCF;
    var totImp = record.TOTIMP;
    var totIVA = record.TOTIVA;
    var totRit = record.RTIMPRIT;
    var rtimpNON = record.RTIMPNON;
    var isDeleted = record['@deleted'];

    var fattura = {
        _id: seqNumberGest,
        idFattura: idFattura,
        annDoc: annDoc,
        datDoc: datDoc,
        codCliente: codCliente,
        totImp: totImp,
        totIVA: totIVA,
        totRit: totRit,
        rtimpNON: rtimpNON,
        isDeleted: isDeleted
    };


    logger.debug("----> CHECKING FATTURA seqNumber: %d", seqNumberGest);

    
    try {

        const resultOp = await mongo.insertOrUpdateFattura(fattura);

        if (resultOp.op !== 'NONE')
            logger.info("SYNC FATTURA: %j", resultOp);

        return resultOp;

    } catch (err) {

        logger.error("ERROR INSERT FATTURA: %s - SEQUENCE NUMBER: %d", err.message, record['@sequenceNumber']);
        throw err;

    }

} // fine doInsertRecord

class SynchronizerFatture {

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
                            logger.debug("BLOCK FATTURE PROCESSED");
                        } catch (errs) {
                            numErrors++;

                            logger.error("ERROR: %s", errs.message);
                        }

                    }


                }, (err) => {

                    logger.error("%s", err);

                },
                async () => {
                    // done

                    // process last
                    try {
                        var results = await doProcessBlockRecords(mongo, accumulatorRecords);
                        logger.info("BLOCK FATTURE PROCESSED");
                    } catch (errs) {
                        numErrors++;

                        logger.error("ERROR: %s", errs.message);
                    } finally {
                        logger.info('COMPLETE REACHED!!!');

                        mongo.closeClient();

                        if (numErrors !== 0) {
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

            mongo.initDBConnection().then(() => {

                parser.on('start', (p) => {
                    logger.info('dBase file %s parsing has started', this.fileName);
                });

                parser.on('header', (h) => {
                    logger.info('dBase file header %s has been parsed - %j', this.fileName, h);
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

        });

    } // fine doWork


}

module.exports = SynchronizerFatture;