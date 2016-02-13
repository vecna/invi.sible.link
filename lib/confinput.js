var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('lib.jsonReader'),
    fs = require('fs');

Promise.promisifyAll(fs);

var jsonReader = function(sourceFile) {

    return fs
        .readFileAsync(sourceFile, "utf-8")
        .then(function(strcontent) {
            return JSON.parse(strcontent);
        })
        .catch(function(error) {
            console.error(error);
            console.log(sourceFile);
            return {}
        })
        .tap(function(content) {
            if (!_.endsWith(sourceFile, '.log')) {
                debug("jsonReader %s: %d entries", sourceFile, _.size(content) );
            }
        });
};

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
    confsource: confsource,
    jsonReader: jsonReader
};
