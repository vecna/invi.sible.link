var _ = require('lodash'),
    Promise = require('bluebird'),
    jsonReader = require('./jsonfiles').jsonReader;
    debug = require('debug')('lib.confinput'),
    fs = require('fs');

Promise.promisifyAll(fs);


/* here we have config/something.json and "italy" or something like that */
var confsource = function(configFile, sourceName) {

    var retD = { config: null, source: null, companies: null };
    return jsonReader(configFile)
        .tap(function(configContent) {
            retD.config = configContent;
        })
        .tap(function() {
            return jsonReader(retD.config.inputs.companies)
                .then(function(companiesContent) {
                    retD.companies = companiesContent;
                });
        })
        .tap(function() {
            return jsonReader( _.get(retD.config.inputs, sourceName) )
                .then(function(sourceContent)  {
                    retD.source = sourceContent;
                });
        }).return(retD);
};

/* maybe other function to operate over the files will be implemented:
 write, update, delete, I don't know */
module.exports = {
    confsource: confsource
};
