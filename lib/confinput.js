var _ = require('lodash'),
    Promise = require('bluebird'),
    fs = require('fs'),
    debug = require('debug')('lib.confinput');

Promise.promisifyAll(fs);

var confsource = function(configFile, sourceName) {

    return fs.readFileAsync(configFile, "utf-8")
        .then(function(content) {
            return JSON.parse(content);
        })
        .then(function(configData) {
            return configData.inputs;
        })
        .then(function(urlSchemaFile) {
            debug("Source file %s ", _.get(urlSchemaFile, sourceName));
            var sourceFile = _.get(urlSchemaFile, sourceName);
            return fs
                .readFileAsync(sourceFile, "utf-8")
                .then(function(contents) {
                    return JSON.parse(contents);
                })
                .then(function(urlList) {
                    return fs
                        .statAsync(sourceFile)
                        .then(function (statinfo) {
                            debug("Included file %s found! (%d bytes)",
                                sourceFile, statinfo.size);
                        })
                        .return(urlList);
                })
                .catch(function(e) {
                    console.error(e.stack);
                });
        });
};

/* maybe other function to operate over the files will be implemented:
 write, update, delete, I don't know */
module.exports = {
    confsource: confsource
};
