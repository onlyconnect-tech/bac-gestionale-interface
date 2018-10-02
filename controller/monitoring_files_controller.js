'use strict'

const fs = require('fs');

const Logger = require('../config/winston.js');

const logger = new Logger("MONITORING_FILES_CONTROLLER");

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

    async registerControll(fileName, cb) {

        const controller = () => {

            logger.debug('START CHECKING %s', fileName);

            logger.debug("CONTAINS FILE CHANGED: %s -> %O", fileName, this.filesToMonitor.get(fileName));
            logger.debug("STATUS CHECKING: %s -> %O", fileName, this.filesModificationStatus.get(fileName));

            var statusFile = this.filesModificationStatus.get(fileName);

            if (statusFile == null) {

                logger.debug('FIRST TIME');
                logger.info("DOING SYNCR %s", fileName);
                // do work
                var now = new Date();
                this.filesModificationStatus.set(fileName, new StatusCheck(true, now));

                // do syncr

                // on finish
                cb().then((result) => {
                    
                    logger.debug("RESULT: %O", result);

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

                logger.debug("STATUS FILE: %O", statusFile);

                // check time 
                if (!statusFile.working &&
                    (this.filesToMonitor.get(fileName) ? this.filesToMonitor.get(fileName).getTime() > statusFile.timeCheck : false)) {

                    logger.info("DOING SYNCR %s", fileName);

                    // do work
                    var now = new Date();
                    this.filesModificationStatus.set(fileName, new StatusCheck(true, now));

                    // do syncr

                    // on finish

                    cb().then((result) => {

                        logger.debug("RESULT: %O", result);

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
                        logger.debug("STILL WORKING SYNCRONIZATION");
                    } else {
                        logger.info("DO NOTHING - YET SYNCHRONIZED %s", fileName);
                    }
                }
            }

            logger.debug('****************** NOW **********************');
            logger.debug("STATUS CHECKING: %s -> %O", fileName, this.filesModificationStatus.get(fileName));
            logger.debug("*********************************************");
            logger.debug();

        }

        await controller(); // start now
        const timer = setInterval(() => { controller(); }, this.frequency * 1000);

        this.operationMappings.set(fileName, {
            timer: timer
        });

        fs.watchFile(fileName, (curr, prev) => {
            console.log(`the current mtime is: ${curr.mtime}`);
            console.log(`the previous mtime was: ${prev.mtime}`);
        
            this.filesToMonitor.set(fileName, curr.mtime);
        
        });

    }



    doStartControll() {

    }

    doStopControll() {

    }

}


module.exports = MonitoringFilesController;