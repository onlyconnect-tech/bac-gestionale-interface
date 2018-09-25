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
const SynchronizerFatture = require("./monitor-gestionale-fatture");
const SynchronizerAnagrafica = require("./monitor-gestionale-anagrafica");

// Connection URL
const urlManogoDb = 'mongodb://localhost:27017';

// Database Name
// 'myproject'
const dbName = 'myproject';

const fileNameFatture = './data/TABFST01.DBF';
const fileNameAnagrafica = './data/ANACF.DBF';

const synchronizerFatture = new SynchronizerFatture(fileNameFatture, urlManogoDb, dbName);

const synchronizerAnagrafica = new SynchronizerAnagrafica(fileNameAnagrafica, urlManogoDb, dbName);

/*

synchronizerFatture.doWork().then((result) => {
    console.log(result);
});

*/

/*

synchronizerAnagrafica.doWork().then((result) => {
    console.log(result);
});

*/

Promise.all([ synchronizerFatture.doWork(), synchronizerAnagrafica.doWork()]).then( (results) => {
    console.log(results);
} ).catch( (err) => {
    console.log(err);
});

