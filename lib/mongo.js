'use strict';

import UnitializedClientError from '../exceptions/UnitializedClientError';

const Logger = require('../config/winston.js');
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
                    anagraficaId: resFind._id
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
                anagraficaId: resFind._id
            };

        } else {
            // do INSERT

            const resInsert = await this.dbMongo.collection(Collections.ANAGRAFICA)
                .insertOne(anagrafica);

            return {
                op: 'INSERT',
                anagraficaId: resInsert.insertedId
            };

        }


    }

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

    findLocation() {
        
        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA)
            .aggregate([
                {
                    $group: {
                        _id: '$location.localita',
                        total: {
                            $sum: 1
                        }
                    }
                }
            ]).sort({ total: -1 });
    }


    getAnagraficaByLocation(locationName) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA).aggregate([
            // 
            {
                $match: {
                    'location.localita': locationName
                }
            },
            {
                $project: {
                    '_id': 0,
                    'location._id': 0,
                    'location.localita': 0
                }
            },
            // { $project: { _id: 0, city: { $arrayElemAt: [ "$location", 0] }}}
        ]).toArray();
    }

    findAnagrafica() {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA).find().toArray();
    }

    findFatture() {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA).find().toArray();
    }

    findFattureByCodCli(codCli) {
        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.FATTURA_CONSOLIDATA).find({ codCliente: codCli}).toArray();
    }

    async findAnagraficheBySequenceNumber(sequenceNumber) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA)
            .findOne({
                _id: sequenceNumber
            });
    }

    async findAnagraficheByCodCli(codcli) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA)
            .findOne({
                codiceCli: codcli
            });
    }

    async findLastAnagrafichaNumber() {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        var arrVal = await this.dbMongo.collection(Collections.ANAGRAFICA)
            .find().sort({
                sequenceNumber: -1
            }).limit(1).toArray();
        return arrVal[0];
    }

    /**
     * Delete content of anagrafiche.
     * 
     * @return {Promise}
     */
    deleteAnagrafiche() {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA).remove({});
    }

    /**
     * close connection
     * 
     * @return {void}
     */
    closeClient() {
        if (this.clientMongo) {
            this.clientMongo.close();

            this.dbMongo = null;
        }
    }

}