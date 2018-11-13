'use strict';

import UnitializedClientError from '../exceptions/UnitializedClientError';

const Logger = require('./logger.js');
const MongoClient = require('mongodb').MongoClient;

const logger = new Logger('MONGO');

const COLLECTION_DATA = 'DATA_BAC';

// Use connect method to connect to the server

const DocumentType = Object.freeze({
    REGISTRY: 'REGISTRY',
    INVOICE: 'INVOICE',
    INVOICE_PART: 'INVOICE-PART'
});


/**
 * @external {Db} http://mongodb.github.io/node-mongodb-native/3.1/api/Db.html
 */

/**
 * @external {MongoClient} http://mongodb.github.io/node-mongodb-native/3.1/api/MongoClient.html
 */

/**
 * Class for connection with Mongo DB
 * @example
 * let mg = new Mongo('mongodb://localhost:27017', 'myproject'); 
 */
export default class Mongo {

    /**
     * @param {string} url  url for connection.
     * @param {string} dbName name of DB.
     */

    constructor (url, dbName) {
        /**
         * @private 
         * @type {string}
         */
        this.url = url;

        /**
         * @private 
         * @type {string}
         */
        this.dbName = dbName;

        /**
         * @private
         * @type {Db}
         */
        this.dbMongo = null;

        /**
         * @private 
         * @type {MongoClient}
         */
        this.clientMongo = null;
    }
    
    /**
     * init mongo Db.
     * 
     * @return {Promise<Db>} returns promise when Db mongo is connected
     */

    initDBConnection() {
        if (this.dbMongo) {
            return Promise.resolve();
        } else {
            return new Promise((resolve, reject) => {
                //const options = { keepAlive: true, connectTimeoutMS: 160000, reconnectTries: 30, reconnectInterval: 5000, useNewUrlParser: true };
                // , reconnectTries: 1 
                const options = { autoReconnect: true, useNewUrlParser: true};
                
                MongoClient.connect(this.url, options, (err, client) => {

                    if (err) {
                        logger.error('On connection: %s', err.message);
                        return reject(err);
                    }

                    logger.info('Connected successfully to server');

                    this.clientMongo = client;

                    this.dbMongo = client.db(this.dbName);

                    return resolve();
                });

            });
        }
    }

    /**
     * return insert op.
     * 
     * @param {Object} anagrafica name of DB.
     * @return {Promise} returns promise insert operation.
     * 
     * @throws {UnitializedClientError}
     */

    async insertAnagrafica(anagrafica) {

        if(!this.dbMongo)
            throw new UnitializedClientError();
        
        // do INSERT
        anagrafica.documentType = DocumentType.REGISTRY;

        const resInsert = await this.dbMongo.collection(COLLECTION_DATA)
            .insertOne(anagrafica);

        return {
            op: 'INSERT',
            seqNumber: anagrafica.sequenceNumber
        };

    }


    /**
     * return update op.
     * 
     * @param {Object} anagrafica name of DB.
     * @return {Promise} returns promise update operation.
     * 
     * @throws {UnitializedClientError}
     */

    async updateAnagrafica(anagrafica) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        // do check on hash
        const resUpdate = await this.dbMongo.collection(COLLECTION_DATA)
            .updateOne({
                sequenceNumber: anagrafica.sequenceNumber,
                documentType: DocumentType.REGISTRY
            }, {
                $set: anagrafica
            });

        return {
            op: 'UPDATE',
            seqNumber: anagrafica.sequenceNumber
        };
        

    }

    /**
     * 
     * @param {Object} fattura 
     * 
     * @throws {UnitializedClientError}
     */
    async insertFattura(fattura) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        //  var id = new ObjectID(fattura.seqNumberGest);

        fattura.documentType = DocumentType.INVOICE;

        const resInsert = await this.dbMongo.collection(COLLECTION_DATA).insertOne(fattura);

        return {
            op: 'INSERT',
            seqNumber: fattura.sequenceNumber
        };
    }


    /**
     * 
     * @param {Object} fattura 
     * 
     * @throws {UnitializedClientError}
     */
    async updateFattura(fattura) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        //  var id = new ObjectID(fattura.seqNumberGest);

        const resUpdate = await this.dbMongo.collection(COLLECTION_DATA).updateOne({
            sequenceNumber: fattura.sequenceNumber,
            documentType: DocumentType.INVOICE
        }, {
            $set: fattura
        });

        return {
            op: 'UPDATE',
            seqNumber: fattura.sequenceNumber
        };

        
    }

    /**
     * 
     * @param {object} fatturaPlus 
     * 
     * @throws {UnitializedClientError}
     */
    async insertFatturaPart(fatturaPlus) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        //  var id = new ObjectID(fattura.seqNumberGest);

        fatturaPlus.documentType = DocumentType.INVOICE_PART;

        const resInsert = await this.dbMongo.collection(COLLECTION_DATA)
            .insertOne(fatturaPlus);

        return {
            op: 'INSERT',
            seqNumber: fatturaPlus.sequenceNumber
        };

    }

    /**
     * 
     * @param {object} fatturaPlus 
     * 
     * @throws {UnitializedClientError}
     */
    async updateFatturaPart(fatturaPlus) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        //  var id = new ObjectID(fattura.seqNumberGest);

        const resUpdate = await this.dbMongo.collection(COLLECTION_DATA)
            .updateOne({
                sequenceNumber: fatturaPlus.sequenceNumber,
                documentType: DocumentType.INVOICE_PART
            }, {
                $set: fatturaPlus
            });

        return {
            op: 'UPDATE',
            seqNumber: fatturaPlus.sequenceNumber
        };

        
    }


    /**
     * close connection
     * 
     * @return {void}
     */
    closeClient() {
        if (this.clientMongo) {
            this.clientMongo.close().catch(err => {
                logger.warn('Problem closing connection %s', err.message);
            });

            this.dbMongo = null;
        }
    }

}