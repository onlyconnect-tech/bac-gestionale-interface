'use strict';

const hash = require('object-hash');

const logger = require('../config/winston.js');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const assert = require('assert');

var clientMongo;

// Use connect method to connect to the server

const Collections = Object.freeze({ LOCATIONS: 'localita', 
    ANAGRAFICA: 'anagrafica'});

var dbMongo;

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
   * return Db.
   * 
   * @param {string} url  url for connection.
   * @param {string} dbName name of DB.
   * @return {Promise<Db>} returns promise od Db.
   */

    getDB(url, dbName) {
        if (dbMongo) {
            return Promise.resolve(dbMongo);
        } else {
            return new Promise(function(resolve, reject) {

                MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
                    
                    if(err) {
                        return reject(err);
                    }

                    logger.info("Connected successfully to server");
                    
                    clientMongo = client;
                    
                    const db = client.db(dbName);
                    
                    dbMongo = db;

                    return resolve(dbMongo);
                });

            });
        }
    }

    findLocation(db) {
        return db.collection(Collections.LOCATIONS)
            .find({}, { projection: { '_id': 0} });
    }

  /**
     * 
     * @param {*} db 
     * @param {*} location 
     * @return objectId
     */

  async doInsertLocationIfNo(db, location){

    const resUpdate = await db.collection(Collections.LOCATIONS).updateOne(location, { $set: location}, { upsert: true });

    if(resUpdate.upsertedCount === 1) {
        // ok inserted
        return { op: 'INSERT', locationId: resUpdate.upsertedId._id };
    }

    // find becuse yet
    const resFind = await db.collection(Collections.LOCATIONS).findOne(location);

    return { op: 'NONE', locationId: resFind._id };
  }

  /**
   * return insert op.
   * 
   * @param {Db} db  db.
   * @param {Anagrafica} anagrafica name of DB.
   * @return {Promise} returns promise insert operation.
   */

  async doInsertAnagrafica(db, anagrafica) {
    
    /**
     * var anagrafica = {
                    sequenceNumber: sequenceNumber,
                    isDeleted: isDeleted,
                    codiceCli: info.codiceCli,
                    ragSoc: ragSoc,
                    indSedeLeg: info.indSedeLeg,
                    codiceFisc: info.codiceFisc,
                    pIva: info.pIva,
                    location: { id_location: idLocation }
                };
     */

    // recupera in base al sequenceNumber

    // retry by sequenceNumber
    // do HASH
    
    // if !find --> insert 
    // else if same hash --> DO NOTHING else UPDATE

    var hashValue = hash(anagrafica);

    anagrafica.hash = hashValue;
    
    const resFind = await db.collection(Collections.ANAGRAFICA)
        .findOne({ sequenceNumber: anagrafica.sequenceNumber });
    
    if(resFind) {   
       
       if(resFind.hash === anagrafica.hash ){

        return { op: 'NONE', anagraficaId: resFind._id };
       }

       // do check on hash
       const resUpdate = await db.collection(Collections.ANAGRAFICA)
            .updateOne({ _id: new ObjectID(resFind._id) }, { $set: anagrafica});
        
        return { op: 'UPDATE', anagraficaId: resFind._id };

    } else {
        // do INSERT

        const resInsert = await db.collection(Collections.ANAGRAFICA)
            .insertOne(anagrafica);
        
        return { op: 'INSERT', anagraficaId: resInsert.insertedId };

    }
    
    
    // se modificata

    // o non modificata

    // find becuse yet
    /*
    const resFind = await db.collection(Collections.ANAGRAFICA)
        .findOne({ sequenceNumber: anagrafica.sequenceNumber });

    const opValue = (1 === resFind.modifiedCount)? 'UPDATE': 'NONE';

    return { op: opValue, anagraficaId: resFind._id };
    */
}


    groupAnagraficaByLocations(db) {
        return db.collection(Collections.ANAGRAFICA).aggregate([
            { $lookup:
               {
                 from: Collections.LOCATIONS,
                 localField: 'location.id_location',
                 foreignField: '_id',
                 as: 'location'
               }
             }, 
             // { $group: { _id: { localita: "$location.localita", cap: "$location.cap", prov:  "$location.prov"}, total: {$sum: 1} }},
             { $group: { _id: "$location.localita", total: {$sum: 1} }},
             // { $sort: { total: -1, _id: 1 }
             { $sort: { "_id": 1 }},
             { $project: { _id: 0, city: { $arrayElemAt: [ "$_id", 0] }, total: 1}}
           
            ]).toArray();

            //,
             // { $sort: { total: -1 }}
    }

    findOrphanLocations(db) {

        return db.collection(Collections.LOCATIONS).aggregate([
            { $lookup:
               {
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

    getAnagraficaByLocation(db, locationName) {

        return db.collection(Collections.ANAGRAFICA).aggregate([
            { $lookup:
               {
                 from: Collections.LOCATIONS,
                 localField: 'location.id_location',
                 foreignField: '_id',
                 as: 'location'
               }
             }, 
            // 
            { $match: { 'location.localita': locationName}}, 
            { $project: { "_id": 0, "location._id": 0, "location.localita": 0 }},
            // { $project: { _id: 0, city: { $arrayElemAt: [ "$location", 0] }}}
            ]).toArray();
    }

    findAnagrafica(db) {
        return db.collection(Collections.ANAGRAFICA).aggregate([
            { $lookup:
               {
                 from: Collections.LOCATIONS,
                 localField: 'location.id_location',
                 foreignField: '_id',
                 as: 'location'
               }
             }, 
             { $project: { "_id": 0, "location._id": 0 }}
            ]).toArray();
    }

    findAnagraficheBySequenceNumber(db, sequenceNumber) {
        return db.collection(Collections.ANAGRAFICA)
            .findOne({ sequenceNumber: sequenceNumber});
    }
    
    // db.collection.find().sort({sequenceNumber:-1})
    async findLastAnagrafichaNumber(db) {
        var arrVal = await db.collection(Collections.ANAGRAFICA)
            .find().sort({sequenceNumber:-1}).limit(1).toArray();
        return arrVal[0];
    }

    /**
     * 
     * @param {Db} db 
     * @returns {Promise}
     */ 
    deleteAnagrafiche(db) {
        return db.collection(Collections.ANAGRAFICA).drop();
    }

    /**
     * close connection
     * @returns {void}
     */
    closeClient() {
        if(clientMongo) {
            clientMongo.close();

            dbMongo = null;
        }
    }

}

