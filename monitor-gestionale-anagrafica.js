import Parser from 'node-dbf';

const logger = require('./config/winston.js');

import Mongo from './lib/mongo';

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
// 'myproject'
const dbName = 'myproject';

var numRow = 0;
let parser = new Parser('./data/ANACF.DBF');

var isFinishedReadingDB = false;

var records = [];

logger.log('info', 'test message %s', 'my string');

parser.on('start', (p) => {
    logger.log('info', 'dBase file %s parsing has started', p.filename, {});
});

parser.on('header', (h) => {
    logger.debug('dBase file header has been parsed %s', JSON.stringify(h));
});

parser.on('record', (record) => {
    numRow++;
    // console.log("PUSH RECORD:", record);
    records.push(record);
});

parser.on('end', (p) => {
    logger.log('info', 'Finished parsing the dBase file - numRow: %d', numRow);
    //console.log( JSON.stringify(record)); 

    isFinishedReadingDB = true;

    doInsertWork();

    /*

    var record = records.shift();
    
    recursiveParser(record);
    
    */

});

parser.parse();

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
            var location = { localita: info.localita, 
                cap: info.cap, 
                prov: info.prov };

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


                

            } catch(err) {
                logger.log('error', "%s", err);
                console.log(err);
            }

            resolve();
    

    });

}

