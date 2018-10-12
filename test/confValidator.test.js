'use strict';

const assert = require('assert');
const confValidator = require('../lib/confValidator');

function testValidConf() {
    var conf = {
        MONGO_URL: 'mongodb://localhost:27017',
        DB_NAME: 'myproject',
        SYNC_FREQUENCY: 60,
        DBF_DIR_PATH: './data'
    };
    
    const result = confValidator.validateConf(conf);
    
    assert(result.isValid === true);
}

function testInvalidConf() {
    var conf = {
        MONGO_URL: 'mongodb://localhost:27017',
        DB_NAME: 'myproject',
        DBF_DIR_PATH: './data'
    };
    
    const result = confValidator.validateConf(conf);
    
    assert(result.isValid === false);
    assert(result.errMsg != null);
}

testValidConf();

testInvalidConf();