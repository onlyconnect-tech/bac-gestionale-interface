'use strict';

/**
 * @typedef {Promise<{op: string, seqNumber: number}>} InsertResult
 * 
 */

/**
 * @typedef {function(cache: Cache, mongo: Mongo, record: object[]): InsertResult} insertFunction
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
 * 
 * @param {Logger} logger 
 * @param {Cache} cache 
 * @param {Mongo} mongo 
 * @param {Array<Object>} recordsBlock - array of records
 * @param {StatusHolder} statusHolder 
 * @param {insertFunction} doInsertRecord 
 * 
 * @return {Promise[]}
 */
export async function doProcessBlockRecords(logger, cache, mongo, recordsBlock, statusHolder, doInsertRecord) {
    
    var current = Promise.resolve();

    return Promise.all(recordsBlock.map((record) => {

        current = current.then(async function() {
            if (statusHolder.isActive())
                return await doInsertRecord(cache, mongo, record); // returns promise
            else
                return {
                    op: 'SKIP',
                    seqNumber: record['@sequenceNumber']
                };
        }).catch(function(err) {
            logger.error('ERROR RESULT BLOCK: %s', err);
            return Promise.reject(err);
        });

        return current;
        
    }));
}


exports.StatusHolder = StatusHolder;

exports.doProcessBlockRecords = doProcessBlockRecords;

