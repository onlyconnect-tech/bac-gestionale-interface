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
    });

}

const monitoringFilesController = new MonitoringFilesController();

monitoringFilesController.registerControll(FILE_TO_CHECK, simulateLongRun);

