var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:various');
var crypto = require('crypto');
var nconf = require('nconf');

var mongo = require('./mongo');

var Geo = require('node-geoip');
var G = new Geo.GeoIP(Geo.Database);

function getGeoIP(sourceIP) {
    var retVal = null;
    // TODO handle 10.x.x.x 127.x.x.x 192.168.x.x 172.16.x.x as "reserved" ?
    if(!_.isUndefined(sourceIP)) {
        try {
            retVal = G.getCountry(sourceIP);
            debug("GeoIP of %s return %j", sourceIP, retVal);
        } catch (ex) {
            retVal = {'code': null, 'country': null, 'ip': sourceIP};
            // debug("GeoIP of %s %s", sourceIP, ex);
        }
    } else {
        retVal = {'code': null, 'country': null, 'ip': sourceIP};
        // debug("GeoIP absent for %s!", sourceIP);
    }
    return retVal;
};

function accessLog(funcName, request, computed) {
    var sourceIP = _.get(request.headers, "x-forwarded-for");
    var geoinfo = getGeoIP(sourceIP);
    var accessInfo = {
        when: moment().toISOString(),
        ccode: geoinfo.code,
        referer: request.headers.referer,
        details: request.url
    };

    if(!_.isUndefined(computed.error)) {
        accessInfo.error = computed.error;
    }

    debug("%s Logging %j", request.randomUnicode, accessInfo);
    return Promise.resolve(
        mongo.writeOne(nconf.get('schema').accesses, accessInfo)
    );
};

function hash(obj, fields) {
    if(_.isUndefined(fields))
        fields = _.keys(obj);
    var plaincnt = fields.reduce(function(memo, fname) {
        return memo += fname + "∴" + _.get(obj, fname, '…miss!') + ",";
        return memo;
    }, "");
    // debug("Hashing of %s", plaincnt);
    sha1sum = crypto.createHash('sha1');
    sha1sum.update(plaincnt);
    return sha1sum.digest('hex');
};

module.exports = {
    accessLog: accessLog,
    hash: hash,
    getGeoIP: getGeoIP
};
