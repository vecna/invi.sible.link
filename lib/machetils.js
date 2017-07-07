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

function jsonFetch(source) {
    return request
        .getAsync(source.url)
        .then(function(response) {
            return JSON.parse(response.body);
        })
        .then(function(content) {
            debug("jsonFetch %s → %", source.url, _.size(content));
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

function mongoSave(cName, content, campName) {
    var data = _.map(content, function(c) {
        return _.extend(c, {
            when: new Date(moment(c.requestTime).format("YYYY-MM-DD")),
            requestTime: new Date(c.requestTime),
            campaign: campName
        });
    });

    return basicSave(cName, data);
};

function basicSave(cName, data) {
    return mongo
        .writeMany(cName, data)
        .then(function(result) {
            debug("Data saved!");
            return data;
        })
        .catch(function(error) {
            debug("Data not saved: %s", error.errmsg);
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
    mongoSave: mongoSave,
    statsSave: basicSave,
    addTime: addTime,
    fatalError: fatalError
};
