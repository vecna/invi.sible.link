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
    debug("Querying URL %s (%d)", source.url, i);
    return request
        .getAsync(source.url)
        .then(function(response) {
            return JSON.parse(response.body);
        })
        .then(function(content) {
			return _.extend(source, {
                data: content,
                timing: addTime('fetch')
			});
        })
        .catch(function(error) {
            debug("Error in connecting to %s", source.url);
			return _.extend(source, {
                data: null,
                timing: addTime('fetch-error')
			});
        });
};

function mongoSave(cName, content, task) {
    var data = {
        data: content,
        when: new Date(),
        task: task 
    };
    debugger;
    return mongo.writeOne(cName, data);
};



module.exports = {
	jsonFetch: jsonFetch,
	mongoSave: mongoSave,
	addTime: addTime
};
