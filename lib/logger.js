'use strict';

const appRoot = require('app-root-path');
var winston = require('winston');

const options = {
    file: {
        level: 'debug',
        filename: `${appRoot}/logs/app.log`,
        handleExceptions: true,
        // json: true,
        maxsize: 55242880, // 5MB
        maxFiles: 5,
        tailable: true,
        colorize: false,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
    },
};

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
                new winston.transports.File(options.file),
                new winston.transports.Console(options.console)
            ],
            exitOnError: false, // do not exit on handled exceptions
        });

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
  