const Joi = require('joi');

/*

var conf = {
    MONGO_URL: 'mongodb://localhost:27017',
    DB_NAME: 'myproject',
    SYNC_FREQUENCY: 60,
    DBF_DIR_PATH: './data'
};

*/

function validateConf(conf) {

    const schema = Joi.object().keys({ 
        MONGO_URL: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        SYNC_FREQUENCY: Joi.number().integer().min(10).required(),
        DBF_DIR_PATH: Joi.string(),
        DELAY_MONGO_REQUEST: Joi.number().integer().min(0)
    });

    const result = Joi.validate(conf, schema);
    // result.error === null -> valid
    if(result.error)
        return { isValid: false, errMsg: result.error.message };
    else {
        return { isValid: true };
    }
}

module.exports = {
    validateConf: validateConf
}