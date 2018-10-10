// Set options as a parameter, environment variable, or rc file.
require = require('esm')(module/*, options*/);


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
    .argv;

var confFile = DEFAULT_CONF_FILE;
if (argv.c) {
    confFile = argv.c;
}

const logger = new Logger('MONITOR_GESTIONALE');

logger.info('STARTING APPLICATION - CONF_FILE: %s', confFile);

const env = require('env2')(confFile);

const MonitoringFilesController = require('./controller/monitoring_files_controller');

const SynchronizerAnagrafica = require('./monitor-gestionale-anagrafica');
const SynchronizerFatture = require('./monitor-gestionale-fatture');
const SynchronizerFatturePart = require('./monitor-gestionale-fatture-part');
const Cache = require('./lib/cache').Cache;


// Connection URL
const urlManogoDb = process.env.MONGO_URL;

// Database Name
const dbName = process.env.DB_NAME;

const syncCheckFrequency = process.env.SYNC_FREQUENCY;

logger.info('STARTING APP');
logger.info('URL MONGODB: %s', urlManogoDb);
logger.info('DB_NAME: %s', dbName);
logger.info('SYNC CHECK FREQUENCY: %d', syncCheckFrequency);

const fileNameAnagrafica = './data/ANACF.DBF';
const fileNameFatture = './data/TABFST01.DBF';
const fileNameFatturePart = './data/TABFST02.DBF';

const cache = new Cache('./cache_db/gestionale-db');

const synchronizerAnagrafica = new SynchronizerAnagrafica(fileNameAnagrafica, cache, urlManogoDb, dbName);

const synchronizerFatture = new SynchronizerFatture(fileNameFatture, cache, urlManogoDb, dbName);

const synchronizerFatturePart = new SynchronizerFatturePart(fileNameFatturePart, cache, urlManogoDb, dbName);


const monitoringFilesController = new MonitoringFilesController(syncCheckFrequency);

monitoringFilesController.registerControll(synchronizerAnagrafica);
monitoringFilesController.registerControll(synchronizerFatture);
monitoringFilesController.registerControll(synchronizerFatturePart);

process.on('SIGINT', async function() {
    logger.info('***** Caught interrupt signal *****');

    // stop registered processing TODO
    await monitoringFilesController.doStopControll();
    
    try {
        await cache.close();
    } catch(err) {
        logger.error(' %s', err.message);
    } finally {
        process.exit();
    }
    
});
