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

let parser = new Parser('./data/TABFST01.DBF');

const mongo = new Mongo();

var dbMongo;

var observerG;

var observable = Observable.create(function subscribe(observer) {
    observerG = observer;
});

observable.subscribe((record) => {

        return doInsertRecord(dbMongo, record).then((result) => {

        }, (err) => {
            console.log("ERROR INSERTING FATTURA:", err.message, "- SEQUENCE NUMBER:", record['@sequenceNumber']);
        });

    }, (err) => {

        console.log(err);

    },
    () => {
        console.log('COMPLETE REACHED!!!');

        mongo.closeClient();

        console.log('CLOSED CLIENT!!!');
    });

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

async function doInsertRecord(db, record) {
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

    /*
    console.log("-idFattura: %d - addDoc: %s - datDoc: %s - codCliente: %d - totImp: %f - totIVA: %f - isDeleted:  %s", 
        idFattura, annDoc, datDoc, codCliente, totImp, totIVA, isDeleted);
    */

    // check if !isDeleted

    const resultOp = await mongo.insertOrUpdateFattura(db, fattura);

    return resultOp;

}