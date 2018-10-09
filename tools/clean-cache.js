'use strict';

const Cache = require('../lib/cache').Cache;

const cache = new Cache('./cache_db/gestionale-db');

var db = cache.db;

console.log(db);

