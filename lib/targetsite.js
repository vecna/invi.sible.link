var _ = require('lodash'),
    Promise = require('bluebird'),
    fs = require('fs'),
    debug = require('debug')('lib.targetsite');

Promise.promisifyAll(fs);

var all = function(configFile, sourceName) {

    return fs.readFileAsync(configFile, "utf-8")
        .then(function(content) {
            return JSON.parse(content);
        })
        .then(function(configData) {
            // console.log(JSON.stringify(configData, undefined, 2));
            return configData.sources;
        })
        .then(function(urlSchemaFile) {
            var sourceFile = urlSchemaFile.italy;
           // debug("full file %s ", _.get(urlSchemaFile, sourceName));
           // var sourceFile = _.get(urlSchemaFile, sourceName)[0];
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
    all: all
};
