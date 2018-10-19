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

export class StatusCheck {

    /**
     * 
     * @param {boolean} working 
     * @param {Date} timeCheck 
     */
    constructor(working, timeCheck) {
        this.working = working;
        this.timeCheck = timeCheck;
    }
}

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
         * SynchronizerWorker holder
         * 
         * @private
         * @type {Map<string, SynchronizerWorker>}
         * 
         */
        this.synchronizerMappings = new Map();

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
        
        /**
         * Hold status working
         * 
         * @private
         * @type {Map<string, StatusCheck>}
         */
        this.filesModificationStatus = new Map();
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

            logger.debug('CONTAINS FILE CHANGED: %s -> %O', fileName, this.filesModificationPendings.get(fileName));
            logger.debug('STATUS CHECKING: %s -> %O', fileName, this.filesModificationStatus.get(fileName));

            var statusFile = this.filesModificationStatus.get(fileName);

            // prende dalla cache --> se null ---> doWork
            //                    --> !null ---> check modification status

            if (statusFile == null) {

                let dateCheck = await this.cache.getLastCheckedFile(fileName);

                if(dateCheck != null) {
                    // check if sequent modifications
                    try {
                        let dateMod = await FileUtil.getDateFileModification(fileName);

                        // check date
                        if(dateMod.getTime()<= dateCheck.getTime()) {
                            // yet syncronized - do nothing
                            logger.info('DO NOTHING YET SYNCRONIZED');
                            return;
                        }
                    } catch (err) {
                        // if not found

                    }


                } else {
                    // as NOW
                }

                logger.debug('FIRST TIME');
                logger.info('DOING SYNCR %s', fileName);
                // do work
                let now = new Date();
                this.filesModificationStatus.set(fileName, new StatusCheck(true, now));

                // do syncr

                // on finish
                let promOp = cb().then(async (result) => {
                    
                    logger.debug('RESULT: %O', result);
                    
                    if(result.status === 'OK') {
                        logger.info('OK SYNCRONIZATION');
                        // if OK
                        var newStatus = this.filesModificationStatus.get(fileName);
                        newStatus.working = false;
                        
                        try {
                            // set new date check
                            await this.cache.setLastCheckedFile(fileName, now);
                        } catch(err) {
                            logger.error('Error setting cache: %s', err.message);
                        }
                        
                    } else {

                        logger.warn('FAILED SYNCRONIZATION');
                        logger.debug('RESETTING PREVIOUS STATE!!');
                        this.filesModificationStatus.set(fileName, statusFile);
                    }
                    
                    return Promise.resolve();
                });

                this.promiseMapping.set(fileName, promOp);

            } else {

                logger.debug('STATUS FILE: %O', statusFile);

                // get promise to check if working
                let promOp = this.promiseMapping.get(fileName);

                if(promOp) {

                    logger.info('**** %o', promOp);

                    logger.info('PROMISE FILE %s IS FINISHED %s', fileName, (promOp.isFulfilled() || promOp.isRejected()));
                } else {
                    logger.info('PROMISE FILE %s NOT FOUND', fileName);
                }

                // check time 
                if (!statusFile.working &&
                    (this.filesModificationPendings.get(fileName) ? this.filesModificationPendings.get(fileName).getTime() > statusFile.timeCheck : false)) {

                    logger.info('DOING SYNCR %s', fileName);

                    // do work
                    let now = new Date();
                    this.filesModificationStatus.set(fileName, new StatusCheck(true, now));

                    // do syncr

                    // on finish

                    let promOp = cb().then(async (result) => {

                        logger.debug('RESULT: %O', result);

                        if(result.status === 'OK') {
                            logger.info('OK SYNCRONIZATION %s', fileName);
                            // if OK
                            var newStatus = this.filesModificationStatus.get(fileName);
                            newStatus.working = false;

                            try {
                                // set new date check
                                await this.cache.setLastCheckedFile(fileName, now);
                            } catch(err) {
                                logger.error('Error setting cache: %s', err.message);
                            }

                        } else {
                            logger.warn('FAILED SYNCRONIZATION');
                            logger.debug('RESETTING PREVIOUS STATE!!');
                            this.filesModificationStatus.set(fileName, statusFile);
                        }

                        return Promise.resolve();
                    });

                    this.promiseMapping.set(fileName, promOp);

                } else {

                    if(statusFile.working) {
                        logger.debug('STILL WORKING SYNCRONIZATION');
                    } else {
                        logger.info('DO NOTHING - YET SYNCHRONIZED %s', fileName);
                    }
                }
            }

            logger.debug('****************** NOW **********************');
            logger.debug('STATUS CHECKING: %s -> %O', fileName, this.filesModificationStatus.get(fileName));
            logger.debug('*********************************************');
            logger.debug();

        };

        this.synchronizerMappings.set(fileName, synchronizerWorker);

        FileUtil.registerFileModificationChecker(fileName, this.filesModificationPendings);
        
        controller(); // start now
        
        const timer = setInterval(() => { controller(); }, this.frequency * 1000);

        this.operationMappings.set(fileName, {
            timer: timer
        });



    }

    async doStopControll() {
        // stoppare i timer

        // stoppare i workers

        // this.operationMappings filename timer


        logger.info('STOP CONTROLL MONITORING');

        for (let [filename, timer] of this.operationMappings) {
            logger.info('--> %s STOPPING TIMER', filename);
            
            clearInterval(timer.timer);
        }
        
        for (let [filename, synchronizer] of this.synchronizerMappings) {
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