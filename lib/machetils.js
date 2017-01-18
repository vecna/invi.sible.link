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

function jsonFetch(source, i, total) {
    return request
        .getAsync(source.url)
        .then(function(response) {
            return JSON.parse(response.body);
        })
        .then(function(content) {
            debug("Request page.id %s (%d,%d%%) return %d entries",
                source.url, i, _.round(i * (100 / total)),  _.size(content));
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
        c.when = new Date();
        c.task = task;
        c.id = various.hash({ machete: c.task, name: c.name, when: c.when});
        return c;
    });
    return mongo.writeMany(cName, data);
};

module.exports = {
	jsonFetch: jsonFetch,
	mongoSave: mongoSave,
	addTime: addTime
};
