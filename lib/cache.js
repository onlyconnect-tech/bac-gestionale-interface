'use strict';

const hash = require('object-hash');
const level = require('level');

/**
 * Enum type - 'SAME', 'MODIFIED', 'NOVALUE'
 * 
 * @typedef {object} ValueStatus
 */
const ValueStatus = Object.freeze({'SAME':1, 'MODIFIED':2, 'NOVALUE':3 });

/**
 * @external {LevelDb} https://github.com/Level/level#ctor
 */

/** 
 * Wrapper class to Level DB http://leveldb.org/ used as a cache.
 * 
*/
export default class Cache {

    /**
     * Create a Level DB or use the existing one if exists.
     * 
     * @param {string} pathFile - path of Level db 
     */
    constructor(pathFile) {
        /**
         * @type {string}
         * @private
         */
        this.pathFile = pathFile;
        /**
         * @type {LevelDb}
         * @private
         */
        this.db = level(pathFile);
    }

    /**
     * 
     * @return {Promise}
     */
    async close() {
        await this.db.close();
    }

    /**
     * 
     * @param {number} id 
     * @param {string} value 
     * 
     * @return {Promise<ValueStatus>}
     */
    async checkAnagraficaHash(id, value) {
        // check if there is or modified is there
        // return NOCHACHE
        // or MODIFIED
        var result = null;
        try {
            result = await this.db.get('anagrafica:' + id);
            var hashValue = hash(value);

            if(result === hashValue)
                return ValueStatus.SAME;
            else
                return ValueStatus.MODIFIED;

        } catch (err) {
            return ValueStatus.NOVALUE;
        }

    }

    /**
     * 
     * @param {number} id 
     * @param {string} value
     * 
     * @return {Promise} 
     */
    
    async setAnagraficaHash(id, value) {

        await this.db.put('anagrafica:' + id, hash(value));
    }

    /**
     * 
     * @param {number} id 
     * @param {string} value 
     * 
     * @return {Promise<ValueStatus>}
     */
    async checkInvoiceHash(id, value) {
        // check if there is or modified is there
        // return NOCHACHE
        // or MODIFIED
        var result = null;
        try {
            result = await this.db.get('invoice:' + id);
            var hashValue = hash(value);

            if(result === hashValue)
                return ValueStatus.SAME;
            else
                return ValueStatus.MODIFIED;

        } catch (err) {
            return ValueStatus.NOVALUE;
        }

    }

    /**
     * 
     * @param {number} id 
     * @param {string} value 
     * 
     * @return {Promise}
     */
    async setInvoiceHash(id, value) {

        await this.db.put('invoice:' + id, hash(value));
    }

    /**
     * 
     * @param {number} id 
     * @param {string} value 
     * 
     * @return {Promise<ValueStatus>}
     */
    async checkInvoicePartHash(id, value) {
        // check if there is or modified is there
        // return NOCHACHE
        // or MODIFIED
        var result = null;
        try {
            result = await this.db.get('invoice-part:' + id);
            var hashValue = hash(value);

            if(result === hashValue)
                return ValueStatus.SAME;
            else
                return ValueStatus.MODIFIED;

        } catch (err) {
            return ValueStatus.NOVALUE;
        }

    }

    /**
     * 
     * @param {number} id 
     * @param {string} value 
     * 
     * @return {Promise}
     */
    async setInvoicePartHash(id, value) {

        await this.db.put('invoice-part:' + id, hash(value));
    }


}

exports.Cache = Cache;
exports.ValueStatus = ValueStatus;


