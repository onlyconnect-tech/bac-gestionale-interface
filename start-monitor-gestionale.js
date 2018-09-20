// Set options as a parameter, environment variable, or rc file.
require = require("esm")(module/*, options*/);

// module.exports = [require("./monitor-gestionale-anagrafica.js"), require("./monitor-gestionale-fatture.js")]

// module.exports = [require("./monitor-gestionale-fatture.js")]

exports.module = {
    
    monitorFatture: require("./monitor-gestionale-fatture.js"),
    // monitorAnagrafica: require("./monitor-gestionale-anagrafica.js")
}