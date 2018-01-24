var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('lib:machetils');
var moment = require('moment');

var mongo = require('../lib/mongo');

function addTime(nome) {
    return {
        'name': nome,
        'when': new Date()
        /* other info if needed */
    };
};

function jsonFetch(source, i) {
    return request
        .getAsync(source.url)
	.timeout(30 * 1000)
        .then(function(response) {
            return JSON.parse(response.body);
        })
        .then(function(content) {
	    debug("%d.jsonFetch %s → %", i +1, source.url, _.size(content));
            return _.extend(source, {
                data: content,
                timing: addTime('fetch')
	    });
        })
        .catch(function(error) {
            debug("Error in connecting to %s: %s", source.url, error);
            return null;
        });
};

function numerize(list) {
    debug("The list in this step has %d elements, sample %s",
        _.size(list), JSON.stringify(_.sample(list), undefined, 2));
}

function basicSave(cName, data) {
    return mongo
        .writeMany(cName, data)
        .then(function(result) {
            debug("Data saved!");
            return data;
        })
        .catch(function(error) {
            debug("Data not saved: %s", error);
            return data;
        });
};

function fatalError(errorstr) {
    debug("%s", errorstr);
    console.log("Fatal error, enable debug to see more: quitting");
    process.exit(1);
};

module.exports = {
    jsonFetch: jsonFetch,
    numerize: numerize,
    statsSave: basicSave,
    addTime: addTime,
    fatalError: fatalError
};
