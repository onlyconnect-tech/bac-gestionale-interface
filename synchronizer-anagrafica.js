import SynchronizerWorker from './synchronizer-worker';
import moment from 'moment';
import hash from 'object-hash';

import { ValueStatus } from './lib/cache';


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
     */
    constructor(fileName, cache, urlManogoDb, dbName) {

        super('SYNC_ANAGRAFICA', fileName, cache, urlManogoDb, dbName);

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

        var isDeleted = record['@deleted'];
        var sequenceNumber = record['@sequenceNumber'];
    
        if (record.CLFR === 'F') {
    
            return {
                op: 'INVALID_TYPE',
                anagraficaId: -1
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
                anagraficaId: -1
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
                _id: sequenceNumber,
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
    
            var cacheStatus = await this.cache.checkAnagraficaHash(anagrafica._id, anagrafica.hash);
    
            if(cacheStatus === ValueStatus.SAME) {
                return {
                    op: 'NONE',
                    seqNumber: anagrafica._id
                };
            }
    
            this.logger.debug('----> CHECK ANAGRAFICA - sequenceNumber: %d, codCli: %d', sequenceNumber, info.codiceCli);
    
            const restInsertAnagrafica = await mongo.insertOrUpdateAnagrafica(anagrafica);
    
            // if(restInsertAnagrafica.op !== 'NONE')
            this.logger.debug('SYNC ANAG: %j', restInsertAnagrafica);
    
            // if op === 'INSERT' add to sync operations
            // if op === 'UPDATE' add to sync operations
            // if op === 'NONE' no need sync operations
    
            await this.cache.setAnagraficaHash(anagrafica._id, anagrafica.hash);
    
            return restInsertAnagrafica;
    
        } catch (err) {
            this.logger.error(err);
            this.logger.error('ERROR INSERT ANAGRAFICA: %s - SEQUENCE NUMBER: %d',  err.message, record['@sequenceNumber']);
            throw err;
        }
    
    }

    
}

module.exports = SynchronizerAnagrafica;