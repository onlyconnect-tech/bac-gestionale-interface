'use strict';

/*

const logger = require('../config/winston.js');

// console.log(logger);

logger.log({ level: 'info', message: 'PIPPO!!!'});
logger.info('PIPPO SIMPLE!!!');
logger.debug('PIOO')
logger.debug('POI')

*/

const { createLogger, format, transports } = require('winston');
const logger = createLogger({
  format: format.combine(
    format.splat(),
    format.timestamp(),
    format.simple()
  ),
  transports: [new transports.Console()]
});

// info: test message my string {}
logger.log('info', 'test message %s', 'my string');

// info: test message 123 {}
logger.log('info', 'test message %d', 123);

// info: test message first second {number: 123}
logger.log('info', 'test message %s, %s', 'first', 'second', { number: 123 });
