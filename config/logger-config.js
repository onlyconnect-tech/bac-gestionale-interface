'use strict';

'use strict';

const appRoot = require('app-root-path');

const  options = {
    file_daily: {
        level: 'debug',
        filename: 'app_%DATE%.log',
        dirname: `${appRoot}/logs`,
        datePattern: 'YYYY-MM-DD-HH',
        zippedArchive: true,
        handleExceptions: true,
        maxFiles: '14d'
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
    },
};

module.exports = options;