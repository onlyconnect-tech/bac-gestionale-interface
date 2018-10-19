import Promise from 'bluebird';
import FileUtil from '../lib/FileUtil';

import Logger from '../lib/logger.js';

const logger = new Logger('MONITORING_FILES_CONTROLLER');

// format seconds in minutes and seconds part
function formatSeconds(seconds) {
    
    const minutes = Math.floor(seconds / 60);

    const rest = seconds % 60;

    return [minutes, rest];

}

const syncrProcedure = (synchronizerWorker) => {

    const startSyncAnag = process.hrtime();

    return synchronizerWorker.doWork().then(function (result) {
        return result;
    }, function(err) {
        logger.error('*** %s', err.message);
        return {
            status: 'ERROR',
            numRow: -1,
            numErrors: -1
        };
    }).finally(function(){
        const diff = process.hrtime(startSyncAnag);
        const fDiff = formatSeconds(diff[0]);
        logger.info(`Benchmark SYNC file:  ${synchronizerWorker.fileName} took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
    });
       
   

};

/**
 * @external {Timer} https://nodejs.org/api/timers.html
 */
/**
 * Classe di controllo dei synchronizer.
 * @example
 * 
 * var monitor = new MonitoringFilesController(60); // monitor every 60 sec.
 * 
 */
export default class MonitoringFilesController {

    /**
     * 
     * @param {number} frequency 
     */
    constructor(cache, frequency) {

        /**
         * @private
         * @type {Cache}
         */
        this.cache = cache;

        /**
         * @private
         * @type {number}
         */
        this.frequency = frequency;

        /**
         * Timers holders
         * 
         * @private
         * @type {Map<string, Timer>}
         * 
         */
        this.operationMappings = new Map();

        /**
         * SynchronizerWorker holder. Vedi {@link MonitoringFilesController.registerSynchronizerWorker}
         * 
         * @private
         * @type {Map<string, SynchronizerWorker>}
         * 
         */
        this.synchronizerWorkersMappings = new Map();

        /**
         * Map promise working
         * 
         * @private
         * @type {Map<string, Promise>}
         */
        this.promiseMapping = new Map();

        /**
         * contains file system files status - mdate modifications
         * 
         * @private
         * @type {Map<string, Date>}
         * 
         */
        this.filesModificationPendings = new Map();
                
    }

    /**
     * Per registrare i syncronizer
     * 
     * @param {SynchronizerAnagrafica|SynchronizerFatture|SynchronizerFatturePart} synchronizerWorker 
     */
    registerSynchronizerWorker(synchronizerWorker) {

        const fileName = synchronizerWorker.fileName;
        const cb = () => {
            return syncrProcedure(synchronizerWorker);
        };

        const controller = async () => {

            logger.debug('START CHECKING %s', fileName);

            var dataModificationPending = this.filesModificationPendings.get(fileName);

            logger.debug('CONTAINS FILE CHANGED: %s -> %O', fileName, this.filesModificationPendings.get(fileName));

            if(dataModificationPending == null) {
                // no mod pendings

                let dateCheck = await this.cache.getLastCheckedFile(fileName);

                if(dateCheck != null) {
                    // check if sequent modifications
                    try {
                        let dateMod = await FileUtil.getDateFileModification(fileName);

                        // check date
                        if(dateMod.getTime()<= dateCheck.getTime()) {
                            // yet syncronized - do nothing
                            logger.info('DO NOTHING YET SYNCRONIZED FILE: %s', fileName);

                            return;
                        }
                    } catch (err) {
                        // if not found

                    }

                }
                
                

                // if ok set date last check


            }

            let workingPromise = this.promiseMapping.get(fileName);

            if(workingPromise && workingPromise.isPending()) {
                logger.info('SYNCRONIZER STILL WONKING ON FILE: %s', fileName);

                return;
            }

            // on finish
            let now = new Date();

            let promOp = cb().then(async (result) => {
                    
                logger.debug('RESULT: %O', result);
                                    
                if(result.status === 'OK') {
                    logger.info('OK SYNCRONIZATION');
                    // if OK
                                       
                    this.filesModificationPendings.set(fileName, null);
                                        
                    try {
                        // set new date check
                        await this.cache.setLastCheckedFile(fileName, now);
                    } catch(err) {
                        logger.error('Error setting cache: %s', err.message);
                    }
                                        
                } else {
                
                    logger.warn('FAILED SYNCRONIZATION');
                }
                                    
                return Promise.resolve();
            });
                
            this.promiseMapping.set(fileName, promOp);


        };

        this.synchronizerWorkersMappings.set(fileName, synchronizerWorker);

        FileUtil.registerFileModificationChecker(fileName, this.filesModificationPendings);
        
        controller(); // start now
        
        const timer = setInterval(() => { controller(); }, this.frequency * 1000);

        this.operationMappings.set(fileName, {
            timer: timer
        });



    }

    /**
     * 
     * @return {Promise} - termination
     */
    async doStopControll() {
        // stoppare i timer

        // stoppare i workers

        // this.operationMappings filename timer


        logger.info('STOP CONTROLL MONITORING');

        for (let [filename, timer] of this.operationMappings) {
            logger.info('--> %s STOPPING TIMER', filename);
            
            clearInterval(timer.timer);
        }
        
        for (let [filename, synchronizer] of this.synchronizerWorkersMappings) {
            logger.info('--> %s STOPPING SYNCRHONIZER', filename);
            
            synchronizer.doStop();
        }

        // miising registration in promiseMapping 
        var arrCurrPromises = [];
        for (let valuePromise of this.promiseMapping.values()) {
            arrCurrPromises.push(valuePromise);
        }


        return Promise.all(arrCurrPromises); 

    }

}


module.exports = MonitoringFilesController;