import Parser from 'node-dbf';
import {
    Observable
} from "rxjs/Observable";

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
    var seqNumberGest = record['@sequenceNumber'];
    var idFattura = record.NUMDOC;
    var annDoc = record.ANNDOC;
    var datDoc = record.DATDOC;
    var codCliente = record.CODCF;
    var totImp = record.TOTIMP;
    var totIVA = record.TOTIVA;
    var isDeleted = record['@deleted'];

    var fattura = {
        seqNumberGest: seqNumberGest,
        idFattura: idFattura,
        annDoc: annDoc,
        datDoc: datDoc,
        codCliente: codCliente,
        totImp: totImp,
        totIVA: totIVA,
        isDeleted: isDeleted
    };


    console.log("-inserting fattura seqNumber: %d",
        seqNumberGest);


    // check if !isDeleted

    const resultOp = await mongo.insertOrUpdateFattura(db, fattura);

    console.log('debug', "SYNC FATTURA:", resultOp);

    return resultOp;

} // fine doInsertRecord

class SynchronizerFatture {

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
                            console.log("*********", errs.message);
                        }

                    }


                }, (err) => {

                    console.log(err);

                },
                async () => {
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

                        resolve({ status: "OK", numRow: this.numRow});
                    }


                });

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

        });

    } // fine doWork


}

module.exports = SynchronizerFatture;