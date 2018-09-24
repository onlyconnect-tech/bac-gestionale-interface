// Set options as a parameter, environment variable, or rc file.
require = require("esm")(module/*, options*/);

// module.exports = [require("./monitor-gestionale-anagrafica.js"), require("./monitor-gestionale-fatture.js")]

// module.exports = require("./monitor-gestionale-fatture.js")

/*

exports.module = {
    
    monitorAnagrafica: require("./monitor-gestionale-anagrafica.js"),
    monitorFatture: require("./monitor-gestionale-fatture.js"),
}
*/

// require("./monitor-gestionale-anagrafica.js");
const SynchronizerFatture = require("./monitor-gestionale-fatture.js");

// Connection URL
const urlManogoDb = 'mongodb://localhost:27017';

// Database Name
// 'myproject'
const dbName = 'myproject';

const fileName = './data/TABFST01.DBF';

var synchronizerFatture = new SynchronizerFatture(fileName, urlManogoDb, dbName);

synchronizerFatture.doWork();




