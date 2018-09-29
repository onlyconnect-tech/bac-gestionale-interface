'use strict'

const fs = require('fs');

class StatusCheck {

    constructor(working, timeCheck) {
        this.working = working;
        this.timeCheck = timeCheck;
    }
}


class MonitoringFilesController {

    constructor() {
        this.operationMappings = new Map();

        this.filesToMonitor = new Map();

        // contains file system files status
        this.filesModificationStatus = new Map();
    }

    registerControll(fileName, cb) {

        const FREQUENCY = 30; // seconds of frequency

        const controller = () => {

            console.log('START CHECKING:', new Date());

            console.log("CONTAINS FILE CHANGED:", fileName, " -> ", this.filesToMonitor.get(fileName));
            console.log("STATUS CHECKING:", fileName, " -> ", this.filesModificationStatus.get(fileName));

            var statusFile = this.filesModificationStatus.get(fileName);

            if (statusFile == null) {

                console.log('FIRST TIME');
                // do work
                var now = new Date();
                this.filesModificationStatus.set(fileName, new StatusCheck(true, now));

                // do syncr

                // on finish
                cb().then(() => {
                    console.log('OK ECECUTION');
                    // if OK
                    var newStatus = this.filesModificationStatus.get(fileName);
                    newStatus.working = false;
                }, () => {
                    console.log('ERROR EXECUTION --> RESETTING PREVIOUS STATE!!');
                    this.filesModificationStatus.set(fileName, statusFile);
                });



            } else {

                console.log("STATUS FILE:", statusFile);

                // check time 
                if (!statusFile.working &&
                    (this.filesToMonitor.get(fileName) ? this.filesToMonitor.get(fileName).getTime() > statusFile.timeCheck : false)) {

                    console.log("DOING SYNCR");

                    // do work
                    var now = new Date();
                    this.filesModificationStatus.set(fileName, new StatusCheck(true, now));

                    // do syncr

                    // on finish

                    cb().then(() => {
                        console.log('OK SYNCRONIZATION');
                        // if OK
                        var newStatus = this.filesModificationStatus.get(fileName);
                        newStatus.working = false;
                    }, () => {
                        console.log('FAILED SYNCRONIZATION');
                        console.log('RESETTING PREVIOUS STATE!!');
                        this.filesModificationStatus.set(fileName, statusFile);
                    });
                } else {
                    console.log("DO NOTHING");
                }
            }

            console.log('****************** NOW **********************');
            console.log("STATUS CHECKING:", fileName, " -> ", 
                this.filesModificationStatus.get(fileName));
            console.log("*********************************************");
            console.log();

        }

        // setTimeout(controller, 0); // start now
        const timer = setInterval(() => { controller(); }, FREQUENCY * 1000);

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