'use strict';

const hash = require('object-hash');

import UnitializedClientError from "../exceptions/UnitializedClientError";

const logger = require('../config/winston.js');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const assert = require('assert');

// Use connect method to connect to the server

const Collections = Object.freeze({
    ANAGRAFICA: 'anagrafica',
    FATTURA_CONSOLIDATA: 'fattura_consolidata'
});


/**
 * @external {Db} http://mongodb.github.io/node-mongodb-native/3.1/api/MongoClient.html#db
 */

/**
 * Class for connection with Mongo DB
 * @example
 * let mg = new Mongo(); 
 */
export default class Mongo {

    /**
     * init mongo Db.
     * 
     * @param {string} url  url for connection.
     * @param {string} dbName name of DB.
     */

    constructor (url, dbName) {
        this.url = url;
        this.dbName = dbName;
        this.dbMongo = null;
        this.clientMongo = null;
    }
    
    /**
     * init mongo Db.
     * 
     * @return {Promise} returns promise when Db mongo is connected
     */

    initDBConnection() {
        if (this.dbMongo) {
            return Promise.resolve();
        } else {
            return new Promise((resolve, reject) => {
                //const options = { keepAlive: true, connectTimeoutMS: 160000, reconnectTries: 30, reconnectInterval: 5000, useNewUrlParser: true };

                const options = {keepAlive: true, connectTimeoutMS: 160000, reconnectTries: 30, reconnectInterval: 5000, useNewUrlParser: true };
                
                MongoClient.connect(this.url, options, (err, client) => {

                    if (err) {
                        return reject(err);
                    }

                    logger.info("Connected successfully to server");

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
     * @param {Db} db  db.
     * @param {Anagrafica} anagrafica name of DB.
     * @return {Promise} returns promise insert operation.
     */

    async insertOrUpdateAnagrafica(anagrafica) {

        if(!this.dbMongo)
            throw new UnitializedClientError();
        
        var hashValue = hash(anagrafica);

        anagrafica.hash = hashValue;

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

        var hashValue = hash(fattura);
        fattura.hash = hashValue;

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




        //  return db.collection(Collections.FATTURA_CONSOLIDATA).insertOne(fattura);


    }

    findLocation() {
        
        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA)
            .find({}, {
                projection: {
                    '_id': 0
                }
            });
    }

    groupAnagraficaByLocations() {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA).aggregate([{
                $lookup: {
                    from: Collections.LOCATIONS,
                    localField: 'location.id_location',
                    foreignField: '_id',
                    as: 'location'
                }
            },
            // { $group: { _id: { localita: "$location.localita", cap: "$location.cap", prov:  "$location.prov"}, total: {$sum: 1} }},
            {
                $group: {
                    _id: "$location.localita",
                    total: {
                        $sum: 1
                    }
                }
            },
            // { $sort: { total: -1, _id: 1 }
            {
                $sort: {
                    "_id": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    city: {
                        $arrayElemAt: ["$_id", 0]
                    },
                    total: 1
                }
            }

        ]).toArray();

        //,
        // { $sort: { total: -1 }}
    }

    findOrphanLocations() {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.LOCATIONS).aggregate([{
                $lookup: {
                    from: Collections.ANAGRAFICA,
                    localField: '_id',
                    foreignField: 'location.id_location',
                    as: 'location2'
                }
            },
            //{ $group: { _id: "$location.localita", total: {$sum: 1} }},
            // { $sort: { total: -1, _id: 1 }
            // { $sort: { "_id": 1 }},
            // { $project: { _id: 0, city: { $arrayElemAt: [ "$_id", 0] }, total: 1}}

        ]).toArray();
    }

    getAnagraficaByLocation(locationName) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA).aggregate([{
                $lookup: {
                    from: Collections.LOCATIONS,
                    localField: 'location.id_location',
                    foreignField: '_id',
                    as: 'location'
                }
            },
            // 
            {
                $match: {
                    'location.localita': locationName
                }
            },
            {
                $project: {
                    "_id": 0,
                    "location._id": 0,
                    "location.localita": 0
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

    findAnagraficheBySequenceNumber(sequenceNumber) {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA)
            .findOne({
                _id: sequenceNumber
            });
    }

    // db.collection.find().sort({sequenceNumber:-1})
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
     * 
     * @param {Db} db 
     * @returns {Promise}
     */
    deleteAnagrafiche() {

        if(!this.dbMongo)
            throw new UnitializedClientError();

        return this.dbMongo.collection(Collections.ANAGRAFICA).remove({});
    }

    /**
     * close connection
     * @returns {void}
     */
    closeClient() {
        if (this.clientMongo) {
            this.clientMongo.close();

            this.dbMongo = null;
        }
    }

}