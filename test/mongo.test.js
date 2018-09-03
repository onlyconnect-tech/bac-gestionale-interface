import Mongo from '../lib/mongo';

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'myproject';

const testInit = async () => {

    let mongo = new Mongo();

    console.log('SONO QUI!!!');

    const db = await mongo.getDB(url, dbName);

    mongo.closeClient();
}

testInit();