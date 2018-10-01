'use strict'

const MonitoringFilesController = require('../controller/monitoring_files_controller');

const FILE_TO_CHECK = './pippo.txt';

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
    }).then(() => {
        // OK
        return {
            status: "OK",
            numRow: 10
        };

    }, () => {
        // ERROR
        return {
            status: "ERROR",
            numRow: 10,
            numErrors: 10
        };
    });

}

const monitoringFilesController = new MonitoringFilesController(30);

monitoringFilesController.registerControll(FILE_TO_CHECK, simulateLongRun);

