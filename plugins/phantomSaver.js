var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('plugin:phantomSaver');
var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var phantomOps = require('../lib/phantomOps');

function savePhantom(gold, conf) {

    if(_.isUndefined(gold.phantom))
        return false;

    var needInfo = ['subjectId', 'href', 'needName', 'disk', 'phantom'];
    var core = _.pick(gold, needInfo);
    core.promiseId = gold.id;
    core.version = 2;
    core.VP = conf.VP;

    return fs
        .readFileAsync(gold.disk.incompath + '.json', 'utf-8')
        .tap(function(x) {
            debug("Read %d bytes from %s", _.size(x), gold.disk.incompath);
        })
        .then(JSON.parse)
        .then(function(content) {
            var ioByPhids = _.reduce(content, phantomOps.phantomCleaning, {});
            /* ioByPeer has key as the phantom.id increment numb */
            return _.map(ioByPhids, function(value) {
                return _.extend(value, core);
            });
        })
        .then(function(data) {
            debug("Saving %d keys/value in .phantom (%s promiseId)",
                _.size(data), data[0].promiseId);
            return mongo.writeMany(nconf.get('schema').phantom, data);
        })
        .catch(function(e) {
            debug("Error: %s", e);
            throw new Error(e);
        });
};

module.exports = function(val, conf) {

    /* indepotent function saver is */
    return savePhantom(val, conf)
        .catch(function(error) {
            debug("Exception: %s with %s", error, JSON.stringify(val, undefined, 2));
            val.saveError = true;
        })
        .return(val)
}
