'use strict';
// Set options as a parameter, environment variable, or rc file.
require = require('esm')(module/*, options*/);

const Cache = require('../lib/cache').Cache;
const ValueStatus = require('../lib/cache').ValueStatus;

const assert = require('assert');

const test1 = async ()=> {

    try {
        const cache = new Cache('./cache_db/test-db');
        
        var valueNO = null;
        
        valueNO = await cache.checkAnagraficaHash(1000, 'PLUTO');
        
        assert(valueNO === ValueStatus.NOVALUE);
        // console.log(valueNO);

        await cache.setAnagraficaHash(1, 'pippo');

        var value = await cache.checkAnagraficaHash(1, 'pippo');
        
        assert(value === ValueStatus.SAME);

        value = await cache.checkAnagraficaHash(1, 'pippoN');

        assert(value === ValueStatus.MODIFIED);

        await cache.close();
        
    } catch(err) {
        console.log('************************');
        console.log(err);
        console.log('************************');
    }
};

const test2 = async () => {
    console.log('CHIAMATA TEST2');

    try {
        const cache = new Cache('./cache_db/test-db');

        let nowDate = new Date();
        await cache.setLastModifiedFile('PIPPO.txt', nowDate);

        let date = await cache.getLastModifiedFile('PIPPO.txt');

        assert(nowDate.getTime() === date.getTime());

        // not in
        await cache.getLastModifiedFile('PLUTO.txt');

        await cache.close();

    } catch (err) {
        console.log('************************');
        console.log(err);
        console.log('************************');
    }
};

// test1();

test2();

