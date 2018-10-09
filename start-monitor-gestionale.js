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
const DEFAULT_CONF_FILE = './env.json';
const Logger = require('./config/winston');

const argv = require('yargs')
    .usage('Usage: $0 option config_file \n e.g $0 -c config_file')
    .alias('c', 'config')
    .nargs('c', 1)
    .describe('c', 'Config file')
    // .demandOption(['c'])
    .help('h')
    .alias('h', 'help')
    .epilog('Copyright OnlyConnect 2018')
    .argv

var confFile = DEFAULT_CONF_FILE;
if (argv.c) {
    confFile = argv.c;
}

const logger = new Logger("MONITOR_GESTIONALE");

logger.info("STARTING APPLICATION - CONF_FILE: %s", confFile);

const env = require('env2')(confFile);

const MonitoringFilesController = require('./controller/monitoring_files_controller');

const SynchronizerFatture = require("./monitor-gestionale-fatture");
const SynchronizerAnagrafica = require("./monitor-gestionale-anagrafica");
const Cache = require('./lib/cache').Cache;


// Connection URL
const urlManogoDb = process.env.MONGO_URL;

// Database Name
const dbName = process.env.DB_NAME;

const syncCheckFrequency = process.env.SYNC_FREQUENCY;

logger.info("STARTING APP");
logger.info("URL MONGODB: %s", urlManogoDb);
logger.info("DB_NAME: %s", dbName);
logger.info("SYNC CHECK FREQUENCY: %d", syncCheckFrequency);

const fileNameAnagrafica = './data/ANACF.DBF';
const fileNameFatture = './data/TABFST01.DBF';
const fileNameFatturePlus = './data/TABFST02.DBF';

const cache = new Cache('./cache_db/gestionale-db');

const synchronizerAnagrafica = new SynchronizerAnagrafica(fileNameAnagrafica, cache, urlManogoDb, dbName);

const synchronizerFatture = new SynchronizerFatture(fileNameFatture, cache, urlManogoDb, dbName);

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
        logger.info(`Benchmark SYNC ANAG took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
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
        logger.info(`Benchmark SYNC INVOICE took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
    }

}

const syncrFatturePlus = async () => {

    const startSyncFatt = process.hrtime();

    try {
        const resFatt = await synchronizerFatturePlus.doWork();
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
        logger.info(`Benchmark SYNC INVOICE PLUS took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
    }

}

const monitoringFilesController = new MonitoringFilesController(syncCheckFrequency);

monitoringFilesController.registerControll(fileNameAnagrafica, syncrAnagrafica);

monitoringFilesController.registerControll(fileNameFatture, syncrFatture);


