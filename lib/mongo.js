const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

var clientMongo;

// Use connect method to connect to the server

var dbMongo;

export default class Mongo {

  /**
   * addition of two numbers
   * @param {string} url  number to add.
   * @param {string} dbName number to add.
   * @return {Promise} returns sum of two parameters.
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

