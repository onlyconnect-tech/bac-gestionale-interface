
import Parser from 'node-dbf';

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

mongo.getDB(url, dbName).then((db) => {
    dbMongo = db;

    parser.on('start', (p) => {
        console.log('dBase file parsing has started');
    });
     
    parser.on('header', (h) => {
        console.log('dBase file header has been parsed' + JSON.stringify(h));
    });
     
    parser.on('record', (record) => {
        numRow ++;
        //console.log( JSON.stringify(record)); 
        doInsertRecord(db, record);
    });
     
    parser.on('end', (p) => {
        console.log('Finished parsing the dBase file - numRow: ' + numRow);
    });
     
    parser.parse();

}, (err) => {
    console.log("ERROR:", err);
});
 


function doInsertRecord(db, record) {
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

    if(!isDeleted) {

        mongo.insertFattura( db, fattura);

        /*

        getIfCodiceCliInAnagraficaClienti(codCliente).then(result => {
            if(!result) {
                console.log("COD_CLI: %d NOT FOUND", codCliente);
            } else {
                insertFatture( idFattura, seqNumberGest, annDoc, datDoc, codCliente, totImp, totIVA).catch(err=> {
                    console.log("--->> seqNumberGest %d - idFattura: %d - addDoc: %s - datDoc: %s - codCliente: %d - totImp: %f - totIVA: %f - isDeleted:  %s | err: %s", 
                        seqNumberGest, idFattura, annDoc, datDoc, codCliente, totImp, totIVA, isDeleted, err.detail);
                });
            }
        }).catch(err=> {
            console.log("--->> idFattura: %d - addDoc: %s - datDoc: %s - codCliente: %d - totImp: %f - totIVA: %f - isDeleted:  %s | err: %s", 
                idFattura, annDoc, datDoc, codCliente, totImp, totIVA, isDeleted, err.detail);
        });

        */

    }

}

function insertFatture( idFattura, seqNumberGest, annDoc, datDoc, codCliente, totImp, totIva) {

    

}