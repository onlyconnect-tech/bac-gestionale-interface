import SynchronizerWorker from './synchronizer-worker';
import moment from 'moment';
import hash from 'object-hash';

import { ValueStatus } from './lib/cache';

import Promise from 'bluebird';

/**
 * @extends {SynchronizerWorker}
 */
export default class SynchronizerAnagrafica extends SynchronizerWorker {

    /**
     * 
     * @param {string} fileName - name of the file synchronizing 
     * @param {Cache} cache - Cache object
     * @param {string} urlManogoDb - url for mongo db connection
     * @param {string} dbName - db name 
     * @param {number} msDelay - ms between request to mongodb
     */
    constructor(fileName, cache, urlManogoDb, dbName, msDelay) {

        super('SYNC_ANAGRAFICA', fileName, cache, urlManogoDb, dbName, msDelay);

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

        var isDeleted = record['@deleted'];
        var sequenceNumber = record['@sequenceNumber'];
    
        if (record.CLFR === 'F') {
    
            return {
                op: 'INVALID_TYPE',
                seqNumber: sequenceNumber
            };
        }
    
        const info = {
            codiceCli: record.CODCF,
            ragSoc: record.RAGSOC,
            indSedeLeg: record.INDIR,
            ragSoc2: record.RAGSOC2,
            codiceFisc: record.CODFISC,
            pIva: record.PARTIVA,
            dataIns: record.DATINS,
            dataUMOD: record.DATUMOD,
            cap: record.CAP,
            localita: record.LOCAL,
            prov: record.PROV
        };
    
    
        let ragSoc = info.ragSoc;
        if (info.ragSoc2) {
            ragSoc = ragSoc + ' - ' + info.ragSoc2;
        }
    
        if (isNaN(info.codiceCli)) {
            this.logger.warn(`INVALID RECORD: ${sequenceNumber}, error parsing - codiceCliente: '${info.codiceCli}'`);
            return {
                op: 'INVALID_PARSING',
                seqNumber: sequenceNumber
            };
        }
    
        // info.localita, info.cap, info.prov
        var location = {
            localita: info.localita,
            cap: info.cap,
            prov: info.prov
        };
    
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
                dataIns: moment(info.dataIns, 'YYYYMMDD').toDate(),
                dataUMOD: moment(info.dataUMOD, 'YYYYMMDD').toDate(),
                location: location
            };
    
            var hashValue = hash(anagrafica);
            anagrafica.hash = hashValue;
    
            var cacheStatus = await this.cache.checkAnagraficaHash(anagrafica.sequenceNumber, anagrafica.hash);
    
            if(cacheStatus === ValueStatus.SAME) {
                return {
                    op: 'NONE',
                    seqNumber: anagrafica.sequenceNumber
                };
            }
    
            this.logger.debug('----> CHECK ANAGRAFICA - sequenceNumber: %d, codCli: %d', sequenceNumber, info.codiceCli);
    
            let resultOp = null;

            if(cacheStatus === ValueStatus.MODIFIED) {
                // update
                resultOp = await mongo.updateAnagrafica(anagrafica);
            } else {
                // no value -> INSERT
                resultOp = await mongo.insertAnagrafica(anagrafica);
            }

            // insertAnagrafica

            // updateAnagrafica
    
            // if(restInsertAnagrafica.op !== 'NONE')
            this.logger.debug('SYNC ANAG: %j', resultOp);
    
            // if op === 'INSERT' add to sync operations
            // if op === 'UPDATE' add to sync operations
            // if op === 'NONE' no need sync operations
    
            await this.cache.setAnagraficaHash(anagrafica.sequenceNumber, anagrafica.hash);
    
            return Promise.delay(msDelay).then(() => { return resultOp; });
    
        } catch (err) {
            this.logger.silly(err);
            this.logger.silly('ERROR INSERT ANAGRAFICA: %s - SEQUENCE NUMBER: %d',  err.message, record['@sequenceNumber']);
            throw err;
        }
    
    }

    
}

module.exports = SynchronizerAnagrafica;