import Mongo from '../lib/mongo';

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'myproject';

const testInit = async () => {

    let mongo = new Mongo();

    try {
        const db = await mongo.getDB(url, dbName);

        mongo.closeClient();
    } catch (e) {
        console.log(e);
    }
}

testInit();