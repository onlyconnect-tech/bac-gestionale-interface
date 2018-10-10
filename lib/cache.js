'use strict';

const hash = require('object-hash');
const level = require('level');

const ValueStatus = Object.freeze({'SAME':1, 'MODIFIED':2, 'NOVALUE':3 });

class Cache {

    constructor(pathFile) {
        this.pathFile = pathFile;
        this.db = level(pathFile);
    }

    async close() {
        await this.db.close();
    }

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

    async setAnagraficaHash(id, value) {

        await this.db.put('anagrafica:' + id, hash(value));
    }


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

    async setInvoiceHash(id, value) {

        await this.db.put('invoice:' + id, hash(value));
    }

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

    async setInvoicePartHash(id, value) {

        await this.db.put('invoice-part:' + id, hash(value));
    }


}

exports.Cache = Cache;
exports.ValueStatus = ValueStatus;


