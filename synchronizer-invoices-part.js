const SynchronizerWorker = require('./synchronizer-worker');

const moment = require('moment');
const hash = require('object-hash');
const ValueStatus = require('./lib/cache').ValueStatus;



export default class SynchronizerInvoicesPart extends SynchronizerWorker {

    /**
     * 
     * @param {string} fileName - name of the file synchronizing 
     * @param {Cache} cache - Cache object
     * @param {string} urlManogoDb - url for mongo db connection
     * @param {string} dbName - db name 
     */
    constructor(fileName, cache, urlManogoDb, dbName) {

        super('SYNC_INVOICES_PART', fileName, cache, urlManogoDb, dbName);

    }

    async doInsertRecord(mongo, record) {
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
                _id: seqNumberGest,
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
    
            var cacheStatus = await this.cache.checkInvoicePartHash(fatturaPart._id, fatturaPart.hash);
    
            if(cacheStatus === ValueStatus.SAME) {
                return {
                    op: 'NONE',
                    seqNumber: fatturaPart._id
                };
            }
    
            this.logger.debug('----> CHECKING FATTURA PART seqNumber: %d', seqNumberGest);
     
            const resultOp = await mongo.insertOrUpdateFatturaPart(fatturaPart);
    
            // if (resultOp.op !== 'NONE')
            this.logger.debug('SYNC FATTURA PART: %j', resultOp);
            
            await this.cache.setInvoicePartHash(fatturaPart._id, fatturaPart.hash);
    
            return resultOp;
    
        } catch (err) {
            this.logger.error(err);
            this.logger.error('ERROR INSERT FATTURA PART: %s - SEQUENCE NUMBER: %d', err.message, record['@sequenceNumber']);
            throw err;
    
        }
    
    } // fine doInsertRecord
    
    
}

module.exports = SynchronizerInvoicesPart;