import SynchronizerWorker from './synchronizer-worker';

import hash from 'object-hash';
import { ValueStatus } from './lib/cache';

import Promise from 'bluebird';

/**
 * @extends {SynchronizerWorker}
 */
export default class SynchronizerInvoicesPart extends SynchronizerWorker {

    /**
     * 
     * @param {string} fileName - name of the file synchronizing 
     * @param {Cache} cache - Cache object
     * @param {string} urlManogoDb - url for mongo db connection
     * @param {string} dbName - db name
     * @param {number} msDelay - ms between request to mongodb 
     */
    constructor(fileName, cache, urlManogoDb, dbName, msDelay) {

        super('SYNC_INVOICES_PART', fileName, cache, urlManogoDb, dbName, msDelay);

    }

    /**
     * @private
     * @override
     * 
     * @param {Mongo} mongo
     * @param {object[]} record
     * @param {number} msDelay - ms of relay return promise
     * 
     * @return {InsertResult}
     */
    async doInsertRecord(mongo, record, msDelay) {
        var seqNumberGest = record['@sequenceNumber'];
        var idFattura = record.NUMDOC;
        var annDoc = record.ANNDOC;
        var numRig = record.NUMRIG;
        var codArt = record.CODART;
        var desArt = record.DESART;
        var prezzo = record.PREZZO;
        var provv = record.PROVV;
        var aliva = record.ALIVA;
    
        var isDeleted = record['@deleted'];
    
        try {
    
            var fatturaPart = {
                sequenceNumber: seqNumberGest,
                idFattura: idFattura,
                annDoc: annDoc,
                numRig: numRig,
                codArt: codArt,
                desArt: desArt,
                prezzo: prezzo,
                provv: provv,
                aliva: aliva,
                isDeleted: isDeleted
            };
    
            var hashValue = hash(fatturaPart);
            fatturaPart.hash = hashValue;
    
            var cacheStatus = await this.cache.checkInvoicePartHash(fatturaPart.sequenceNumber, fatturaPart.hash);
    
            if(cacheStatus === ValueStatus.SAME) {
                return {
                    op: 'NONE',
                    seqNumber: fatturaPart.sequenceNumber
                };
            }
    
            this.logger.debug('----> CHECKING FATTURA PART seqNumber: %d', seqNumberGest);
     
            let resultOp = null;

            if(cacheStatus === ValueStatus.MODIFIED) {
                // update
                resultOp = await mongo.updateFatturaPart(fatturaPart);
            } else {
                // no value -> INSERT
                resultOp = await mongo.insertFatturaPart(fatturaPart);
            }
    
            // if (resultOp.op !== 'NONE')
            this.logger.debug('SYNC FATTURA PART: %j', resultOp);
            
            await this.cache.setInvoicePartHash(fatturaPart.sequenceNumber, fatturaPart.hash);
            
            return Promise.delay(msDelay).then(() => { return resultOp; });
    
        } catch (err) {
            this.logger.silly(err);
            this.logger.silly('ERROR INSERT FATTURA PART: %s - SEQUENCE NUMBER: %d', err.message, record['@sequenceNumber']);
            throw err;
    
        }
    
    } // fine doInsertRecord
    
    
}

module.exports = SynchronizerInvoicesPart;