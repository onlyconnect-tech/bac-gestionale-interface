# BAC GESTIONALE INTERFACE

https://github.com/standard-things/esm

https://zellwk.com/blog/crud-express-mongodb/


## CARICAMENTO DATI

`node start-monitor-gestionale` using default `env.json` config file or `node start-monitor-gestionale -c <CONFIG_FILE>` with a 
specific config file.

### CONFIG FILE

Example [env_template.json](./env_template.json)
```json
{
    "MONGO_URL": "<VALUE MONGO URL>",
    "DB_NAME": "<VALUE DB NAME>",
    "SYNC_FREQUENCY": 60,
    "DBF_DIR_PATH": "<PATH DIR DBF FILES>"
}
```
If no file is specified with `-c` option, default `./env.json` is used.

| Param| Desc|
|---|---|
| _MONGO_URL_   |  Url mongo db server |
| _DB_NAME_ | mongo db instance name |
| _SYNC_FREQUENCY_ | seconds frequency for check synchronization |
| _DBF_DIR_PATH_ | path dir `.DBF` files |

### CLEAN CACHE

`node tools/clean-cache.js -d ANAGRAFICA -p ./cache_db/gestionale-db-test`

## SERVER

http://localhost:3000/anagrafica

http://localhost:3000/delete-anagrafica

## VALIDATION
https://medium.com/@piotrkarpaa/handling-joi-validation-errors-in-hapi-17-26fc07448576

https://codeburst.io/joi-validate-input-and-define-databases-in-javascript-84adc6f1474b


### HAPI 17

https://medium.com/yld-engineering-blog/so-youre-thinking-about-updating-your-hapi-js-server-to-v17-b5732ab5bdb8

https://github.com/hapijs/bounce


https://medium.com/@iaincollins/error-handling-in-javascript-a6172ccdf9af

### MONGODB

https://www.w3schools.com/nodejs/nodejs_mongodb_join.asp

https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/

### HAPI & MONGODB

https://patrick-meier.io/build-a-restful-api-using-hapi-js-and-mongodb/


### MISC

https://www.infoq.com/articles/Starting-With-MongoDB


http://adampaxton.com/handling-multiple-javascript-promises-even-if-some-fail/

### AZURE

https://blogs.msdn.microsoft.com/bigdatasupport/2015/09/02/dealing-with-requestratetoolarge-errors-in-azure-documentdb-and-testing-performance/





