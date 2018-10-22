'use strict';

const  winston = require('winston');
require('winston-daily-rotate-file');

const loggerOptions = require('../config/logger-config');

const myFormat = winston.format.printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

/**
 * Logging class
 * 
 */ 

export default class Logger {

    /**
     * 
     * @param {string} label label on log file
     */
    constructor(label) {

        /**
         * @private
         */
        this.logger = winston.createLogger({
          
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.splat(),
            
                winston.format.label({ label: label }),
                myFormat
            
            ),
          
            transports: [
                new winston.transports.Console(loggerOptions.console),
                new winston.transports.DailyRotateFile(loggerOptions.file_daily)
            ],
            exitOnError: false, // do not exit on handled exceptions
        });

    }

    silly(message = '', ...args) {
        this.logger.log('silly', message, ...args);
    }

    debug(message = '', ...args) {
        this.logger.log('debug', message, ...args);
    }

    info(message = '', ...args) {
        this.logger.log('info', message, ...args);
    }

    warn(message = '', ...args) {
        this.logger.log('warn', message, ...args);
    }

    error(message = '', ...args) {
        this.logger.log('error', message, ...args);
    }
}

module.exports = Logger;
  