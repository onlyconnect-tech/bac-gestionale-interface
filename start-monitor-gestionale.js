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

// format seconds in minutes and seconds part
function formatSeconds(seconds) {
    
    const minutes = Math.floor(seconds / 60);

    const rest = seconds % 60;

    return [minutes, rest];

}

const syncrAnagrafica = async () => {

    const startSyncAnag = process.hrtime();

    try {
        const resAnag = await synchronizerAnagrafica.doWork();
        console.log(resAnag);
    } catch (err) {
        console.log(err);
    } finally {
        const diff = process.hrtime(startSyncAnag);
        const fDiff = formatSeconds(diff[0]);
        console.log(`Benchmark took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
    }

}

const syncrFatture = async () => {

    const startSyncFatt = process.hrtime();

    try {
        const resFatt = await synchronizerFatture.doWork();
        console.log(resFatt);
    } catch (err) {
        console.log(err);
    } finally {
        const diff = process.hrtime(startSyncFatt);
        const fDiff = formatSeconds(diff[0]);
        console.log(`Benchmark took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
    }

}

const init = async () => {

   await syncrAnagrafica();

   await syncrFatture();
    
}

init();

