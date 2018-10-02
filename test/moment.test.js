'use strict';

const moment = require('moment');

var m1 = moment('20091220', 'YYYYMMDD');

console.log(m1.format(), m1.toDate());

if (m1.format() instanceof Date) {
    console.log('SONO FATA')
} else if (m1.format() instanceof String){
    console.log('SONO FATA1')
}

console.log(typeof m1.format())

