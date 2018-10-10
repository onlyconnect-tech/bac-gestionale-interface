'use strict';

const fs = require('fs');

const Logger = require('../config/winston.js');

const logger = new Logger('MONITORING_FILES_CONTROLLER');

// format seconds in minutes and seconds part
function formatSeconds(seconds) {
    
    const minutes = Math.floor(seconds / 60);

    const rest = seconds % 60;

    return [minutes, rest];

}

const syncrProcedure = async (synchronizerWorker) => {

    const startSyncAnag = process.hrtime();

    try {
        const resAnag = await synchronizerWorker.doWork();
        // console.log(resAnag);
        return resAnag;
    } catch (err) {
        logger.error('*** %s', err.message);
        return {
            status: 'ERROR',
            numRow: -1,
            numErrors: -1
        };
    } finally {
        const diff = process.hrtime(startSyncAnag);
        const fDiff = formatSeconds(diff[0]);
        logger.info(`Benchmark SYNC ANAG took ${fDiff[0]} minutes / ${fDiff[1]} seconds`);
    }

};

class StatusCheck {

    constructor(working, timeCheck) {
        this.working = working;
        this.timeCheck = timeCheck;
    }
}


class MonitoringFilesController {

    constructor(frequency) {

        this.frequency = frequency;

        this.operationMappings = new Map();

        this.filesToMonitor = new Map();

        // contains file system files status
        this.filesModificationStatus = new Map();
    }

    async registerControll(synchronizerWorker) {

        const fileName = synchronizerWorker.fileName;
        const cb = () => {
            return syncrProcedure(synchronizerWorker);
        };

        const controller = () => {

            logger.debug('START CHECKING %s', fileName);

            logger.debug('CONTAINS FILE CHANGED: %s -> %O', fileName, this.filesToMonitor.get(fileName));
            logger.debug('STATUS CHECKING: %s -> %O', fileName, this.filesModificationStatus.get(fileName));

            var statusFile = this.filesModificationStatus.get(fileName);

            if (statusFile == null) {

                logger.debug('FIRST TIME');
                logger.info('DOING SYNCR %s', fileName);
                // do work
                var now = new Date();
                this.filesModificationStatus.set(fileName, new StatusCheck(true, now));

                // do syncr

                // on finish
                cb().then((result) => {
                    
                    logger.debug('RESULT: %O', result);

                    if(result.status === 'OK') {
                        logger.info('OK SYNCRONIZATION');
                        // if OK
                        var newStatus = this.filesModificationStatus.get(fileName);
                        newStatus.working = false;

                    } else {

                        logger.warn('FAILED SYNCRONIZATION');
                        logger.debug('RESETTING PREVIOUS STATE!!');
                        this.filesModificationStatus.set(fileName, statusFile);
                    }
                    
                });



            } else {

                logger.debug('STATUS FILE: %O', statusFile);

                // check time 
                if (!statusFile.working &&
                    (this.filesToMonitor.get(fileName) ? this.filesToMonitor.get(fileName).getTime() > statusFile.timeCheck : false)) {

                    logger.info('DOING SYNCR %s', fileName);

                    // do work
                    var now = new Date();
                    this.filesModificationStatus.set(fileName, new StatusCheck(true, now));

                    // do syncr

                    // on finish

                    cb().then((result) => {

                        logger.debug('RESULT: %O', result);

                        if(result.status === 'OK') {
                            logger.info('OK SYNCRONIZATION %s', fileName);
                            // if OK
                            var newStatus = this.filesModificationStatus.get(fileName);
                            newStatus.working = false;

                        } else {
                            logger.warn('FAILED SYNCRONIZATION');
                            logger.debug('RESETTING PREVIOUS STATE!!');
                            this.filesModificationStatus.set(fileName, statusFile);
                        }

                    });
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

        await controller(); // start now
        const timer = setInterval(() => { controller(); }, this.frequency * 1000);

        this.operationMappings.set(fileName, {
            timer: timer
        });

        fs.watchFile(fileName, (curr, prev) => {
            logger.info(`the current mtime is: ${curr.mtime}`);
            logger.info(`the previous mtime was: ${prev.mtime}`);
        
            this.filesToMonitor.set(fileName, curr.mtime);
        
        });

    }

    async doStopControll() {
        // stoppare i timer

        // stoppare i workers


        logger.info('STOP CONTROLL TODO');
        return Promise.resolve(1); 

    }

}


module.exports = MonitoringFilesController;