var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('various');
var mong = require('./mongo');

var accessLog = function(funcName, request, computed) {
    var sourceIP = _.get(request.headers, "x-forwarded-for");
    var geoinfo = utils.getGeoIP(sourceIP);
    var accessInfo = {
        when: moment().toISOString(),
        ip: sourceIP,
        ccode: geoinfo.code,
        referer: request.headers.referer,
        details: details
    };

    debug("%s Logging %j", request.randomUnicode, details);
    return Promise.resolve(
        /* stress test, because maybe is too much and is better 
         * keep in memory and flush once a while */
        mongo.writeOne(nconf.get('schema').accesses, accessInfo)
    );
};


module.exports = {
    accessLog: accessLog
};
