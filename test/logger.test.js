'use strict';

const Logger = require('../config/winston.js');

const logger = new Logger("TEST");

// info: test message my string {}
logger.info('test message %s', 'my string');

// info: test message 123 {}
logger.info('test message %d', 123);

// info: test message first second {number: 123}
logger.info('test message %s, %s, %s', 'first', 'second', 'third');
