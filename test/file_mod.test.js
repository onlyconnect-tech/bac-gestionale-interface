'use strict';

const fs = require('fs');
const fileName = './data/TABFST01.DBF';

fs.stat(fileName, (err, stats)=> {
    if(err) {
        console.log(err.message);
        return;
    }

    // Date
    console.log(stats.mtime);
});