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

const Logger = require('./config/winston');

const MonitoringFilesController = require('./controller/monitoring_files_controller');

const SynchronizerFatture = require("./monitor-gestionale-fatture");
const SynchronizerAnagrafica = require("./monitor-gestionale-anagrafica");

const logger = new Logger("MONITOR_GESTIONALE");

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
        // console.log(resAnag);
        return resAnag;
    } catch (err) {
        logger.error("*** %s", err.message);
        return {
            status: "ERROR",
            numRow: -1,
            numErrors: -1
        };
    } finally {
        const diff = process.hrtime(startSyncAnag);
        const fDiff = formatSeconds(diff[0]);
        logger.info(`Benchmark took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
    }

}

const syncrFatture = async () => {

    const startSyncFatt = process.hrtime();

    try {
        const resFatt = await synchronizerFatture.doWork();
        // console.log(resFatt);
        return resFatt;
    } catch (err) {
        logger.error(err);
        return {
            status: "ERROR",
            numRow: -1,
            numErrors: -1
        };
    } finally {
        const diff = process.hrtime(startSyncFatt);
        const fDiff = formatSeconds(diff[0]);
        logger.info(`Benchmark took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
    }

}

const init = async () => {

   await syncrAnagrafica();

   await syncrFatture();
    
}

// init();

const FREQUENCY = 60;

const monitoringFilesController = new MonitoringFilesController(FREQUENCY);

monitoringFilesController.registerControll(fileNameAnagrafica, syncrAnagrafica);

monitoringFilesController.registerControll(fileNameFatture, syncrFatture);


