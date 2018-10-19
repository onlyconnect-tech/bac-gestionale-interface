'use strict';
// Set options as a parameter, environment variable, or rc file.
require = require('esm')(module/*, options*/);

const FileUtil = require('../lib/FileUtil');

const fileName = './data/TABFST01.DBF';

FileUtil.getDateFileModification(fileName).then((date) => {
    console.log(date);
});

FileUtil.getDateFileModification('./data/PIPPO.DBF').catch((err) => {
    console.log(err.message);
});
