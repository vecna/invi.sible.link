var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('saver');
var moment = require('moment');
var nconf = require('nconf');

var various = require('../lib/various');
var mongo = require('../lib/mongo');
var urlutils = require('../lib/urlutils');


function dissectHeaders(memo, hdr) {

    /* TODO: fare special, set-Cookie e le date, vanno parsate */
    var standards = ['Content-Type', 'Expires', 'Date', 'Server', 'Last-Modified', 'Set-Cookie' ];
    var ignored = [ 'Vary', 'Content-Encoding', 'Connection', 'ETag', 'Accept-Ranges'];

    if(ignored.indexOf(hdr.name) !== -1)
        return memo;

    if(standards.indexOf(hdr.name) !== -1) {
        memo.standardHeaders[hdr.name] = hdr.value;
        return memo;
    }

    memo.proprietaryHeaders.push(hdr);
    return memo;
};

/* save in mongodb what is not going to be deleted after,
 * = the JSON from the fetcher, and the path associated for static files
 * like html and screenshot */
function phantomCleaning(memo, rr, i) {
    
    /* here the data uri get cut off, and header get simplify */
    var id = rr.id;

    if(_.isUndefined(memo[id])) {
        /* is the request */
        memo[id] = {
                url: rr.url,
                requestTime: new Date(moment(rr.when).toISOString())
        };
        if(rr.method === "POST") {
            debug("Manage POST!");
        }
    } else /* is the response: status 'start' or 'end' */ {

        if(rr.stage == "end") {
            debug("Skipping 'end' %s %s", memo[id].url, rr.url);
            return memo;
        }

        var urlId = various.hash({
            'url': rr.url
        });
        var domainId = various.hash({
            'domain': urlutils.urlToDomain(rr.url)
        });
        var relationId = various.hash({
            'path': urlutils.urlClean(rr.url)
        });

        var h = _.reduce(rr.headers, dissectHeaders, {
            standardHeaders: {},
            proprietaryHeaders: []
        });

        memo[id] = _.extend(memo[id], {
            urlId: urlId,
            domainId: domainId,
            relationId: relationId,
            proprietary: h.proprietaryHeaders
        });
        memo[id] = _.extend(memo[id], h.standardHeaders);
    }

    debug("%d ID %d %s", i, id, JSON.stringify(memo[id], undefined, 2));
    return memo;

};

function savePhantom(gold) {

    if(_.isUndefined(gold.phantom))
        return false;

    var needInfo = ['subjectId', 'href', 'needName', 'id', 'disk', 'phantom'];
    var core = _.pick(gold, needInfo);

    return fs
        .readFileAsync(gold.disk.incompath + '.json', 'utf-8')
        .then(JSON.parse)
        .then(function(content) {
            var ioByPhids = _.reduce(content, phantomCleaning, {});
            /* ioByPeer has key as the phantom.id increment numb */
            return _.map(ioByPhids, function(value) {
                return _.extend(value, core);
            });
        })
        .then(function(data) {
            debug("Saving %d", _.size(data));
            return mongo.writeMany(nconf.get('schema').phantom, data);
        })
        .return(true);
};

function saveThug(gold) {
};

module.exports = function(val, conf) {

    debug("Saving into the db...");

    return Promise
        .all([ savePhantom(val), saveThug(val) ])
        .return(val);
}
