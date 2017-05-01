var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('lib:machetils');
var moment = require('moment');

var various = require('../lib/various');
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
            var tinfo = _.find(content, { target: true});
            debug("jsonFetch %s → %d inclusions [%s]", source.url,  _.size(content), tinfo.url);
			return _.extend(source, {
                data: content,
                timing: addTime('fetch')
			});
        })
        .catch(function(error) {
            debug("Error in connecting to %s", source.url);
            return null;
        });
};

function mongoSave(cName, content, task) {
    var data = _.map(content, function(c) {
        return _.extend(c, {
            when: new Date(),
            requestTime: new Date(c.requestTime),
        });
    });
    return mongo.writeMany(cName, data);
};

function fatalError(errorstr) {
    debug("%s", errorstr);
    console.log("Fatal error, enable debug to see more: quitting");
    process.exit(1);
};

module.exports = {
	jsonFetch: jsonFetch,
	mongoSave: mongoSave,
	addTime: addTime,
    fatalError: fatalError
};
