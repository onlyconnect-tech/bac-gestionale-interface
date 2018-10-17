import SynchronizerWorker from './synchronizer-worker';

import moment from 'moment';
import hash from 'object-hash';
import { ValueStatus } from './lib/cache';

/**
 * @extends {SynchronizerWorker}
 */
export default class SynchronizerInvoices extends SynchronizerWorker {

    /**
     * 
     * @param {string} fileName - name of the file synchronizing 
     * @param {Cache} cache - Cache object
     * @param {string} urlManogoDb - url for mongo db connection
     * @param {string} dbName - db name 
     */
    constructor(fileName, cache, urlManogoDb, dbName) {

        super('SYNC_INVOICES', fileName, cache, urlManogoDb, dbName);

    }

    /**
     * @private
     * @override
     * 
     * @param {Mongo} mongo
     * @param {object[]} record
     * 
     * @return {InsertResult}
     */
    async doInsertRecord(mongo, record) {
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
    
            var cacheStatus = await this.cache.checkInvoiceHash(fattura._id, fattura.hash);
    
            if(cacheStatus === ValueStatus.SAME) {
                return {
                    op: 'NONE',
                    seqNumber: fattura._id
                };
            }
    
            this.logger.debug('----> CHECKING FATTURA seqNumber: %d', seqNumberGest);
     
            const resultOp = await mongo.insertOrUpdateFattura(fattura);
    
            // if (resultOp.op !== 'NONE')
            this.logger.debug('SYNC FATTURA: %j', resultOp);
            
            await this.cache.setInvoiceHash(fattura._id, fattura.hash);
    
            return resultOp;
    
        } catch (err) {
            this.logger.error(err);
            this.logger.error('ERROR INSERT FATTURA: %s - SEQUENCE NUMBER: %d', err.message, record['@sequenceNumber']);
            throw err;
    
        }

    }
    
    
}

module.exports = SynchronizerInvoices;