var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('lib:fs');

function writePromise(fpath, dict) {
    var str = JSON.stringify(dict, undefined, 2);
    return fs
        .writeFileAsync(fpath, str)
        .then(function(result) {
            debug("written file %s %d bytes", fpath, _.size(str) );
            return true;
        })
        .catch(function(error) { 
            debug("Error in %s: %s", fpath, error);
			return false;
    	});
}

function readPromise(fpath) {
    return fs
        .readFileAsync(fpath, "utf-8")
        .then(JSON.parse) 
        .catch(function(error) { 
            debug("Error in %s: %s", fpath, error);
		});
}

module.exports = {
	readPromise: readPromise,
	writePromise: writePromise
}
