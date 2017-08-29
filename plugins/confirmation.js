var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('plugin:confirmation');
var moment = require('moment');
var nconf = require('nconf');

var choputils = require('../lib/choputils');

nconf.argv().env();

module.exports = function(need, conf) {

    var type = nconf.get('type');
    var url = choputils.composeURL(
        choputils.getVP(nconf.get('VP')),
        nconf.get('source'),
        {
            what: 'doneTask',
            type: type,
            param: need.id
        });
        
    return request
        .getAsync(url)
        .then(function(response) {
            return JSON.parse(response.body);
        })
        .then(function(response) {
            if(_.isObject(response) &&
               _.isString(response.result) &&
               response.result !== "OK") {
                debug("Unexpected response: %j", response);
            }
        })
        .catch(function(error) {
            debug("%s error: %s", url, error);
            throw new Error(error);
        })
        .return(need);
};
