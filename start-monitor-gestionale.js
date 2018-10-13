// Set options as a parameter, environment variable, or rc file.
require = require('esm')(module/*, options*/);


const DEFAULT_CONF_FILE = './env.json';
const fs = require('fs');
const path = require('path');
const Logger = require('./config/winston');

const argv = require('yargs')
    .usage('Usage: $0 option config_file \n e.g $0 -c config_file')
    .alias('c', 'config')
    .nargs('c', 1)
    .describe('c', 'Config file')
    .help('h')
    .alias('h', 'help')
    .epilog('Copyright OnlyConnect 2018')
    .argv;

var confFile = DEFAULT_CONF_FILE;
if (argv.c) {
    confFile = argv.c;
}

const logger = new Logger('MONITOR_GESTIONALE');

// check if present

if(!fs.existsSync(confFile)) {
    logger.error('FILE %s NOT FOUND - EXIT PROCESS', confFile);
    process.exit();
}

// check format
const confValidator = require('./lib/confValidator');
const contentsConfFile = fs.readFileSync(confFile, 'utf8');

try {
    const conf = JSON.parse(contentsConfFile);
    const result = confValidator.validateConf(conf);

    if(!result.isValid) {
        logger.error('ERROR CONF FILE %O - ERROR: %s', conf, result.errMsg);
        process.exit();
    }
} catch(err) {
    process.error('INVALID JSON FORMAT conf file: %s', contentsConfFile);
    process.exit();
}

logger.info('STARTING APPLICATION - CONF_FILE: %s', confFile);

const env = require('env2')(confFile);

const MonitoringFilesController = require('./controller/monitoring_files_controller');

const SynchronizerAnagrafica = require('./synchronizer-gestionale-anagrafica');
const SynchronizerFatture = require('./synchronizer-gestionale-fatture');
const SynchronizerFatturePart = require('./synchronizer-gestionale-fatture-part');

const Cache = require('./lib/cache').Cache;


// Connection URL
const urlManogoDb = process.env.MONGO_URL;

// Database Name
const dbName = process.env.DB_NAME;

const syncCheckFrequency = process.env.SYNC_FREQUENCY;

const dbfDirOath = process.env.DBF_DIR_PATH || './data';

logger.info('STARTING APP');
logger.info('URL MONGODB: %s', urlManogoDb);
logger.info('DB_NAME: %s', dbName);
logger.info('SYNC CHECK FREQUENCY: %d', syncCheckFrequency);
logger.info('DBF_DIR_PATH: %s', dbfDirOath);

const fileNameAnagrafica = path.join(dbfDirOath, 'ANACF.DBF');
const fileNameFatture = path.join(dbfDirOath, 'TABFST01.DBF');
const fileNameFatturePart = path.join(dbfDirOath, 'TABFST02.DBF');

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
    
    /*
    try {
        await cache.close();
    } catch(err) {
        logger.error(' %s', err.message);
    } finally {
        process.exit();
    }
    */
    
});
