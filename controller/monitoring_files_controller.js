'use strict'

const fs = require('fs');

var filesToMonitor = new Map();

var timeChecking = new Map();

const FREQUENCY = 30; // seconds of frequency
const controller = () => {

    console.log('START CHECKING:', new Date());

    console.log("CONTAINS FILE CHANGED:", filesToMonitor);
    console.log("STATUS CHECKING:", timeChecking);

    var statusFile = timeChecking.get(FILE_TO_CHECK);

    if (statusFile == null) {

        console.log('FIRST TIME');
        // do work
        var now = new Date();
        timeChecking.set(FILE_TO_CHECK, new StatusCheck(true, now));

        // do syncr

        // on finish
        simulateLongRun().then(() => {
            console.log('OK ECECUTION');
            // if OK
            var newStatus = timeChecking.get(FILE_TO_CHECK);
            newStatus.working = false;
        }, () => {
            console.log('ERROR EXECUTION --> RESETTING PREVIOUS STATE!!');
            timeChecking.set(FILE_TO_CHECK, statusFile);
        });



    } else {

        console.log("STATUS FILE:", statusFile);

        // check time 
        if (!statusFile.working &&
            (filesToMonitor.get(FILE_TO_CHECK) ? filesToMonitor.get(FILE_TO_CHECK).getTime() > statusFile.timeCheck : false)) {

                console.log("DOING SYNCR");

            // do work
            var now = new Date();
            timeChecking.set(FILE_TO_CHECK, new StatusCheck(true, now));

            // do syncr

            // on finish

            simulateLongRun().then(() => {
                console.log('OK SYNCRONIZATION');
                // if OK
                var newStatus = timeChecking.get(FILE_TO_CHECK);
                newStatus.working = false;
            }, () => {
                console.log('FAILED SYNCRONIZATION');
                console.log('RESETTING PREVIOUS STATE!!');
                timeChecking.set(FILE_TO_CHECK, statusFile);
            });
        } else {
            console.log("DO NOTHING");
        }
    }

    console.log('****************** NOW **********************');
    console.log("STATUS CHECKING:", timeChecking);
    console.log("*********************************************");
    console.log();

}

// setTimeout(controller, 0); // start now
setInterval(controller, FREQUENCY * 1000);

function simulateLongRun() {
    console.log('STARTING OPERATION!!!');
    return new Promise(function (resolve, reject) {

        setTimeout(() => {
            var num = Math.floor(Math.random() * 10);

            if (num <= 7) {
                console.log('OPERATION OK');
                resolve();
            } else {
                console.log('OPERATION ERROR!!!');
                reject();
            }
        }, 40 * 1000);
    });

}

const FILE_TO_CHECK = './pippo.txt';

fs.watchFile(FILE_TO_CHECK, (curr, prev) => {
    console.log(`the current mtime is: ${curr.mtime}`);
    console.log(`the previous mtime was: ${prev.mtime}`);

    filesToMonitor.set(FILE_TO_CHECK, curr.mtime);

});

class StatusCheck {

    constructor(working, timeCheck) {
        this.working = working;
        this.timeCheck = timeCheck;
    }
}

