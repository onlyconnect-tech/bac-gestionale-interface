const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const assert = require('assert');

var clientMongo;

// Use connect method to connect to the server

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

                    console.log("Connected successfully to server");
                    
                    clientMongo = client;
                    
                    const db = client.db(dbName);
                    
                    dbMongo = db;

                    return resolve(dbMongo);
                });

            });
        }
    }

    findLocation(db) {
        return db.collection('location').find({}, { projection: { '_id': 0} });
    }

    findLocationById(db, id) {
        return db.collection('location').findOne({_id: new ObjectID(id) }, { projection: { '_id': 0} });
    }

  /**
   * 
   * @param {*} db 
   * @param {*} location 
   * @return objectId
   */
  async doInsertLocation(db, location){

    return new Promise(function(resolve, reject) {
        db.collection('location').insertOne(location, function(err, r) {
            if(err) {
                return reject(err);
            }

            resolve(r.insertedId);
        });
    });
  }

    /**
   * 
   * @param {*} db 
   * @param {*} location 
   * @return objectId
   */
  async doInsertLocationOnlyOne(db, location){


    return new Promise(function(resolve, reject) {

        db.collection('location').findOne(location, (err, doc) => {
            if(err) {
                console.log(err);
                return reject(err);
            }

            if(doc) {
                return resolve(doc._id);
            } else {
                // do insert

                db.collection('location').insertOne(location, function(err, r) {
                    if(err) {
                        return reject(err);
                    }
        
                    return resolve(r.insertedId);
                });
            }
        });

        /*
        db.collection('location').insertOne(location, function(err, r) {
            if(err) {
                return reject(err);
            }

            resolve(r.insertedId);
        });
        */
    });
  }

  /**
   * return insert op.
   * 
   * @param {Db} db  db.
   * @param {Anagrafica} anagrafica name of DB.
   * @return {Promise} returns promise insert operation.
   */

    doInsertAnagrafica(db, anagrafica) {
        
        return new Promise(function(resolve, reject) {
            db.collection('anagrafica').insertOne(anagrafica, function(err, r) {
                if(err) {
                    return reject(err);
                }

                resolve(r);
            });
        });

    }

    findAnagrafica(db) {
        return db.collection('anagrafica').aggregate([
            { $lookup:
               {
                 from: 'location',
                 localField: 'location.id_location',
                 foreignField: '_id',
                 as: 'location'
               }
             }, 
             { $project: { "_id": 0, "location._id": 0 }}
            ]).toArray();
    }

    findAnagraficheBySequenceNumber(db, sequenceNumber) {
        return db.collection('anagrafica').findOne({ sequenceNumber: sequenceNumber});
    }
    
    // db.collection.find().sort({sequenceNumber:-1})
    async findLastAnagrafichaNumber(db) {
        var arrVal = await db.collection('anagrafica').find().sort({sequenceNumber:-1}).limit(1).toArray();
        return arrVal[0];
    }

    /**
     * 
     * @param {Db} db 
     * @returns {Promise}
     */ 
    deleteAnagrafiche(db) {
        return db.collection('anagrafica').drop();
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

