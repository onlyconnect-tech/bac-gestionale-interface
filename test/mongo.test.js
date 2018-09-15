import Mongo from '../lib/mongo';

const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'mytestproject';

const testUpsert = async () => {

    let mongo = new Mongo();

    try {
        const db = await mongo.getDB(url, dbName);

        const localita = { name: 'SAMARATE', prov: 'VARESE', cap: 21017 };

        const resUpdate = await db.collection('localita').updateOne(localita, { $set: localita}, {upsert: true});

        console.log(resUpdate);
        console.log("MOD UPSERTED_ID:", resUpdate.upserted);

        assert(0 === resUpdate.modifiedCount);
        assert(1 === resUpdate.upsertedCount);
        
        console.log("INSERT UPSERTED_ID:", resUpdate.upsertedId);

        const localitaMod = { name: 'SAMARATE', prov: 'VA', cap: 21017 };

        const resUpdate2 = await db.collection('localita').updateOne(localita, {$set: localitaMod}, {upsert: true});

        console.log('######################################################');

        console.log(resUpdate2);
        console.log("MOD UPSERTED_ID:", resUpdate2.upsertedId);

        assert(1 === resUpdate2.modifiedCount);
        assert(0 === resUpdate2.upsertedCount);
        

        

        mongo.closeClient();
    } catch (e) {
        console.log(e);
    }
}

testUpsert();