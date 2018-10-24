import Parser from 'node-dbf';
import {
    Observable
} from 'rxjs/Observable';

import Promise from 'bluebird';
import Logger from './lib/logger.js';

import Mongo from './lib/mongo';

/**
 * @typedef {Promise<{op: string, seqNumber: number}>} InsertResult
 * 
 */

/**
 * @typedef {function(mongo: Mongo, record: object[]): InsertResult} insertFunction
 * @throws Error - if error on insert or update in mongo db
 */


const STATUS = Object.freeze({
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    STOP: 'stop'
});

/**
 * 
 */
export class StatusHolder {
    
    constructor() {
        /**
         * @type {Object} - enum for status INACTIVE | ACTIVE | STOP
         * @private 
         */
        this._status = STATUS.INACTIVE;
    }
    
    /**
     * set status ACTIVE
     * 
     * @return
     */
    setStatusActive() {
        this._status = STATUS.ACTIVE;
    }

    /**
     * set status STOP
     * 
     * @return
     */
    setStatusStop() {
        this._status = STATUS.STOP;
    }

    /**
     * @return {boolean}
     */
    isActive() {
        return this._status === STATUS.ACTIVE;
    }

    /**
     * 
     * @return {boolean}
     */
    isStop() {
        return this._status === STATUS.STOP;
    }
}


/**
 * @interface
 * 
 */
export default class SynchronizerWorker {

    /**
     * @param {string} lableLogger - lable loger
     * @param {string} fileName - name of the file synchronizing 
     * @param {Cache} cache - Cache object
     * @param {string} urlManogoDb - url for mongo db connection
     * @param {string} dbName - db name 
     */
    constructor(lableLogger, fileName, cache, urlManogoDb, dbName) {

        /**
         * @private
         * @type {Logger}
         */
        this.logger = new Logger(lableLogger);
        
        /**
         * @private
         * @type {string} - name file to sync
         */
        this.fileName = fileName;

        /**
         * @private
         * @type {Cache}
         */
        this.cache = cache;

        /**
         * @private
         * @type {string} - url mongo
         */
        this.urlManogoDb = urlManogoDb;

        /**
         * @private
         * @type {string} - db name mongo
         */
        this.dbName = dbName;

        /**
         * Number of records loaded from file
         * 
         * @private
         * @type {number}
         */
        this.numRow = 0;

        /**
         * @private
         * @type {StatusHolder}
         */
        this.statusHolder = new StatusHolder();
        
    }

    /**
     * Execute synchronization
     * 
     * @return {Promise}
     */
    doWork() {
        
        this.statusHolder.setStatusActive();

        return new Promise((resolve, reject) => {
            const parser = new Parser(this.fileName);
            const mongo = new Mongo(this.urlManogoDb, this.dbName);

            var observerG;

            var accumulatorRecords = [];

            var queued = [];
            var parallel = 3;

            var observable = Observable.create(function subscribe(observer) {
                observerG = observer;
            });

            observable.subscribe(async (record) => {
                const splitLength = 100;

                accumulatorRecords.push(record);

                if (accumulatorRecords.length == splitLength) {
                    const recordsBlock = accumulatorRecords;

                    accumulatorRecords = [];
                    // call insert block

                    let mustComplete = Math.max(0, queued.length - parallel + 1);
                    // when enough items are complete, queue another request for an item    
                    let download = Promise.some(queued, mustComplete)
                        .then(() => { return this.doProcessBlockRecords(mongo, recordsBlock); });
                    queued.push(download);
                    
                }


            }, (err) => {

                this.logger.error('%s', err);

                /*
                        
                        */

            }, async () => {
                // done

                this.logger.info('PROCESSING LAST BLOCK!!!');

                let mustComplete = Math.max(0, queued.length - parallel + 1);
                // when enough items are complete, queue another request for an item    
                let download = Promise.some(queued, mustComplete)
                    .then(() => { return this.doProcessBlockRecords(mongo, accumulatorRecords); });
                queued.push(download);

                Promise.all(queued).then((results)=> {

                    this.logger.info('COMPLETED SYNC: %O', results);

                    resolve({
                        status: 'OK',
                        numRow: this.numRow
                    });

                }, (err) => {
                        
                    this.logger.error('COMPLETED SYNC: %s', err.message);

                    return resolve({
                        status: 'ERROR',
                        numRow: this.numRow
                    }); 

                }).finally(()=> {

                    this.logger.info('COMPLETE REACHED - IN FINALLY!!!');

                    mongo.closeClient();

                    this.numRow = 0;

                });
                   
            });

            mongo.initDBConnection().then(() => {

                parser.on('start', (p) => {
                    this.logger.info('dBase file %s parsing has started', this.fileName);
                });

                parser.on('header', (h) => { 
                    this.logger.info('dBase file %s header has been parsed %j', this.fileName, h);
                });

                parser.on('record', (record) => {
                    this.numRow++;
                    //console.log( JSON.stringify(record)); 
                    observerG.next(record);
                });

                parser.on('end', (p) => {
                    this.logger.info('Finished parsing the dBase file %s - numRow: %d', this.fileName, this.numRow);
                    observerG.complete();
                });

                parser.parse();

            }, (err) => {
                this.logger.error('ERROR: %s', err);
                reject(err);
            });

        }); // close promise

    } // fine doWork

    /**
     * @private
     * 
     * @param {Mongo} mongo 
     * @param {Array<Object>} recordsBlock - array of records
     * 
     * @return {Promise[]}
     */
    async doProcessBlockRecords(mongo, recordsBlock) {
    
        var current = Promise.resolve();

        return Promise.all(recordsBlock.map((record) => {

            current = current.then(() => {
                if (this.statusHolder.isActive()) {
                    return this.doInsertRecord(mongo, record).then(result => {
                        return result;
                    }).catch((err) => {
                        this.logger.error('ERROR RESULT ITEM: %s', err.message);
                        return Promise.reject(err);
                    });
                }
                else
                    return {
                        op: 'SKIP',
                        seqNumber: record['@sequenceNumber']
                    };
            });

            return current;
        
        }));
    }

    /**
     * @private
     * @abstract
     * 
     * @param {Mongo} mongo
     * @param {object[]} record
     * 
     * @return {InsertResult}
     */
    async doInsertRecord(mongo, record) {
        throw new Error('Method to override');
    }

    /**
     * set {@link statusHolder} for stop execution
     */
    doStop() {

        this.statusHolder.setStatusStop();
        
        this.logger.info('CALL STOP SYNC'); 
    }

    /**
     * 
     * @return {boolean}
     */
    isStopping() {
        return this.statusHolder.isStop();
    }

}

module.exports = SynchronizerWorker;