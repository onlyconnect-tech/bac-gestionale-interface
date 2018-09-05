const MongoClient = require('mongodb').MongoClient;
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

    findAnagrafiche(db) {
        return db.collection('anagrafica').find();
    }

    findAnagraficheBySequenceNumber(db, sequenceNumber) {
        return db.collection('anagrafica').findOne({ sequenceNumber: sequenceNumber});
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

