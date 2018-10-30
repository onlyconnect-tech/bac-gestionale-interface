'use strict';

import UnitializedClientError from '../exceptions/UnitializedClientError';

const Logger = require('./logger.js');
const MongoClient = require('mongodb').MongoClient;

const logger = new Logger('MONGO');

// Use connect method to connect to the server

const Collections = Object.freeze({
    ANAGRAFICA: 'anagrafica',
    FATTURA_CONSOLIDATA: 'fattura_consolidata',
    FATTURA_CONSOLIDATA_PART: 'fattura_consolidata_part'
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

    async insertOrUpdateAnagrafica(anagrafica) {

        if(!this.dbMongo)
            throw new UnitializedClientError();
        
        const resFind = await this.dbMongo.collection(Collections.ANAGRAFICA)
            .findOne({
                _id: anagrafica._id
            });


        if (resFind) {
            if (resFind.hash === anagrafica.hash) {

                return {
                    op: 'NONE',
                    seqNumber: resFind._id
                };
            }

            // do check on hash
            const resUpdate = await this.dbMongo.collection(Collections.ANAGRAFICA)
                .updateOne({
                    _id: resFind._id
                }, {
                    $set: anagrafica
                });

            return {
                op: 'UPDATE',
                seqNumber: resFind._id
            };

        } else {
            // do INSERT

            const resInsert = await this.dbMongo.collection(Collections.ANAGRAFICA)
                .insertOne(anagrafica);

            return {
                op: 'INSERT',
                seqNumber: resInsert.insertedId
            };

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

        const resInsert = await this.dbMongo.collection(Collections.ANAGRAFICA)
            .insertOne(anagrafica);

        return {
            op: 'INSERT',
            seqNumber: resInsert.insertedId
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
        const resUpdate = await this.dbMongo.collection(Collections.ANAGRAFICA)
            .updateOne({
                _id: anagrafica._id
            }, {
                $set: anagrafica
            });

        return {
            op: 'UPDATE',
            seqNumber: anagrafica._id
        };
        

    }

    /**
     * 
     * @param {Object} fattura 
     * 
     * @throws {UnitializedClientError}
     */
    async insertOrUpdateFattura(fattura) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        //  var id = new ObjectID(fattura.seqNumberGest);

        const resFind = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA)
            .findOne({
                _id: fattura._id
            });


        if (resFind) {
            if (resFind.hash === fattura.hash) {

                return {
                    op: 'NONE',
                    seqNumber: resFind._id
                };
            }

            // do check on hash
            const resUpdate = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA)
                .updateOne({
                    _id: resFind._id
                }, {
                    $set: fattura
                });

            return {
                op: 'UPDATE',
                seqNumber: resFind._id
            };

        } else {
            // do INSERT

            const resInsert = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA)
                .insertOne(fattura);

            return {
                op: 'INSERT',
                seqNumber: resInsert.insertedId
            };

        }

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

        const resInsert = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA)
            .insertOne(fattura);

        return {
            op: 'INSERT',
            seqNumber: resInsert.insertedId
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

        const resUpdate = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA)
            .updateOne({
                _id: fattura._id
            }, {
                $set: fattura
            });

        return {
            op: 'UPDATE',
            seqNumber: fattura._id
        };

        
    }

    /**
     * 
     * @param {object} fatturaPlus 
     * 
     * @throws {UnitializedClientError}
     */
    async insertOrUpdateFatturaPart(fatturaPlus) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        //  var id = new ObjectID(fattura.seqNumberGest);

        const resFind = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA_PART)
            .findOne({
                _id: fatturaPlus._id
            });


        if (resFind) {
            if (resFind.hash === fatturaPlus.hash) {

                return {
                    op: 'NONE',
                    seqNumber: resFind._id
                };
            }

            // do check on hash
            const resUpdate = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA_PART)
                .updateOne({
                    _id: resFind._id
                }, {
                    $set: fatturaPlus
                });

            return {
                op: 'UPDATE',
                seqNumber: resFind._id
            };

        } else {
            // do INSERT

            const resInsert = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA_PART)
                .insertOne(fatturaPlus);

            return {
                op: 'INSERT',
                seqNumber: resInsert.insertedId
            };

        }

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

        const resInsert = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA_PART)
            .insertOne(fatturaPlus);

        return {
            op: 'INSERT',
            seqNumber: resInsert.insertedId
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

        const resUpdate = await this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA_PART)
            .updateOne({
                _id: fatturaPlus._id
            }, {
                $set: fatturaPlus
            });

        return {
            op: 'UPDATE',
            seqNumber: fatturaPlus._id
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