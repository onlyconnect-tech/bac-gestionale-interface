'use strict';

const STATUS = Object.freeze({
    INACTIVE: 'inactive',
    ACTIVE: 'active',
    STOP: 'stop'
});

class StatusHolder {
    constructor() {
        this.status = STATUS.INACTIVE;
    }
    
    setStatusActive() {
        this.status = STATUS.ACTIVE;
    }

    setStatusStop() {
        this.status = STATUS.STOP;
    }
}

async function doProcessBlockRecords(logger, cache, mongo, recordsBlock, statusHolder, doInsertRecord) {
    
    var current = Promise.resolve();

    return Promise.all(recordsBlock.map((record) => {

        current = current.then(async function() {
            if (statusHolder.status === STATUS.ACTIVE)
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
