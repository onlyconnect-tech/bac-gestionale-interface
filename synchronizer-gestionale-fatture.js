import Parser from 'node-dbf';
import {
    Observable
} from 'rxjs/Observable';

const Promise = require('bluebird');
const moment = require('moment');
const hash = require('object-hash');

const Logger = require('./lib/logger.js');

const logger = new Logger('SYNC_FATTURE');

import Mongo from './lib/mongo';

const ValueStatus = require('./lib/cache').ValueStatus;

const StatusHolder = require('./synchronizer-commons').StatusHolder;
const doProcessBlockRecords = require('./synchronizer-commons').doProcessBlockRecords;

async function doInsertRecord(cache, mongo, record) {
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

    try {

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

        var hashValue = hash(fattura);
        fattura.hash = hashValue;

        var cacheStatus = await cache.checkInvoiceHash(fattura._id, fattura.hash);

        if(cacheStatus === ValueStatus.SAME) {
            return {
                op: 'NONE',
                seqNumber: fattura._id
            };
        }

        logger.debug('----> CHECKING FATTURA seqNumber: %d', seqNumberGest);
 
        const resultOp = await mongo.insertOrUpdateFattura(fattura);

        // if (resultOp.op !== 'NONE')
        logger.debug('SYNC FATTURA: %j', resultOp);
        
        await cache.setInvoiceHash(fattura._id, fattura.hash);

        return resultOp;

    } catch (err) {
        logger.error(err);
        logger.error('ERROR INSERT FATTURA: %s - SEQUENCE NUMBER: %d', err.message, record['@sequenceNumber']);
        throw err;

    }

} // fine doInsertRecord

export default class SynchronizerFatture {

    /**
     * 
     * @param {string} fileName name of the file synchronizing 
     * @param {Cache} cache 
     * @param {string} urlManogoDb url for mongo db connection
     * @param {string} dbName db name 
     */
    constructor(fileName, cache, urlManogoDb, dbName) {
        this.fileName = fileName;
        this.cache = cache;
        this.urlManogoDb = urlManogoDb;
        this.dbName = dbName;

        this.arrPromisesBlocksProcessing = [];
        this.numRow = 0;

        this.statusHolder = new StatusHolder();
    }

    /**
     * Execute synchronization
     * 
     * @return {Promise}     * 
     */
    doWork() {

        this.statusHolder.setStatusActive();
        
        return new Promise((resolve, reject) => {
            const parser = new Parser(this.fileName);
            const mongo = new Mongo(this.urlManogoDb, this.dbName);

            var observerG;

            var accumulatorRecords = [];

            var observable = Observable.create(function subscribe(observer) {
                observerG = observer;
            });

            observable.subscribe(async (record) => {
                const splitLength = 5000;
                accumulatorRecords.push(record);
                if (accumulatorRecords.length == splitLength) {
                    const recordsBlock = accumulatorRecords;

                    accumulatorRecords = [];
                    // call insert block

                    var resultsP = doProcessBlockRecords(logger, this.cache, mongo, recordsBlock, this.statusHolder, doInsertRecord);

                    this.arrPromisesBlocksProcessing.push(resultsP);

                }


            }, (err) => {

                logger.error('%s', err);

            },
            async () => {
                // done

                // process last

                logger.info('PROCESSING LAST BLOCK!!!');

                var resultsP = doProcessBlockRecords(logger, this.cache, mongo, accumulatorRecords, this.statusHolder, doInsertRecord);

                this.arrPromisesBlocksProcessing.push(resultsP);

                Promise.all(this.arrPromisesBlocksProcessing).then((results)=> {

                    logger.info('LAST: %O', results);

                    resolve({
                        status: 'OK',
                        numRow: this.numRow
                    });

                }, (err) => {
                        
                    logger.error('LAST: %s', err);

                    return resolve({
                        status: 'ERROR',
                        numRow: this.numRow
                    }); 

                }).finally(()=> {

                    logger.info('COMPLETE REACHED - IN FINALLY!!!');

                    mongo.closeClient();

                    this.numRow = 0;

                    this.arrPromisesBlocksProcessing = [];
                });


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
                logger.error('ERROR: %s', err);
                reject(err);
            });

        });

    } // fine doWork

    doStop() {

        this.statusHolder.setStatusStop();

        logger.info('STOP SYNC INVOICES'); 
    }
}

module.exports = SynchronizerFatture;