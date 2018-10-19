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
         * Promises accumulator
         * 
         * @private
         * @type {Promise[]}
         */
        this.arrPromisesBlocksProcessing = [];

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

                    var resultsP = this.doProcessBlockRecords(mongo, recordsBlock);

                    this.arrPromisesBlocksProcessing.push(resultsP);

                }


            }, (err) => {

                this.logger.error('%s', err);

                /*
                        
                        */

            }, async () => {
                // done

                this.logger.info('PROCESSING LAST BLOCK!!!');

                var resultsP = this.doProcessBlockRecords(mongo, accumulatorRecords);

                this.arrPromisesBlocksProcessing.push(resultsP);

                Promise.all(this.arrPromisesBlocksProcessing).then((results)=> {

                    this.logger.info('LAST: %O', results);

                    resolve({
                        status: 'OK',
                        numRow: this.numRow
                    });

                }, (err) => {
                        
                    this.logger.error('LAST: %s', err);

                    return resolve({
                        status: 'ERROR',
                        numRow: this.numRow
                    }); 

                }).finally(()=> {

                    this.logger.info('COMPLETE REACHED - IN FINALLY!!!');

                    mongo.closeClient();

                    this.numRow = 0;

                    this.arrPromisesBlocksProcessing = [];
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

            current = current.then(async () => {
                if (this.statusHolder.isActive())
                    return await this.doInsertRecord(mongo, record); // returns promise
                else
                    return {
                        op: 'SKIP',
                        seqNumber: record['@sequenceNumber']
                    };
            }).catch((err) => {
                this.logger.error('ERROR RESULT BLOCK: %s', err);
                return Promise.reject(err);
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

}

module.exports = SynchronizerWorker;