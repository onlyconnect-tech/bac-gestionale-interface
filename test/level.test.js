'use strict';

const Cache = require('../lib/cache').Cache;
const ValueStatus = require('../lib/cache').ValueStatus;

const assert = require('assert');

const test1 = async ()=> {

    try {
        const cache = new Cache('./cache_db/test-db');
        
        var valueNO = null;
        
        valueNO = await cache.checkAnagraficaHash(1000, "PLUTO");
        
        assert(valueNO === ValueStatus.NOVALUE);
        // console.log(valueNO);

        await cache.setAnagraficaHash(1, 'pippo');

        var value = await cache.checkAnagraficaHash(1, 'pippo');
        
        assert(value === ValueStatus.SAME);

        value = await cache.checkAnagraficaHash(1, 'pippoN');

        assert(value === ValueStatus.MODIFIED);

    } catch(err) {
        console.log("************************");
        console.log(err)
        console.log("************************");
    }
}

test1();

