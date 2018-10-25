var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var various = require('../lib/various');
var debug = require('debug')('lib:phantomOps');
var urlutils = require('../lib/urlutils');

/* plugin/phantomSaver uses all of them, 
 * bin/monoSite and readReport uses less */
var coreFields = [ 'url', 'requestTime', 'target',
                   'promiseId', 'domainId', 'urlId',
                   'subjectId' ];

function shrinkMeanings(collection) {

    return _.values(_.reduce(collection, function(memo, e) {
        if(e.target) {
            memo[e.promiseId] = _.pick(e, coreFields);
            memo[e.promiseId].thirdparties = 0;
            memo[e.promiseId].scripts = 0;
            memo[e.promiseId].relations = [];
        } 

        if(!memo[e.promiseId])
            debug("Problema!");

        if(!e.target)
            memo[e.promiseId].thirdparties += 1;

        if(e['Content-Type'] && e['Content-Type'].match('script'))
            memo[e.promiseId].scripts += 1;

        if(memo[e.promiseId].relations.indexOf(e.relationId) === -1)
            memo[e.promiseId].relations.push(e.relationId);

        return memo;
    }, {}));

};

function serializeList(collection) {
    return _.map(collection, function(e) {
        return _.pick(e, coreFields);
    });
}

function readReport(path) {
    return fs
        .readFileAsync(path, 'utf-8')
        .tap(function(x) {
            debug("Read %d bytes from %s", _.size(x), path);
        })
        .then(JSON.parse)
        .then(function(content) {
            return _.reduce(content, phantomCleaning, {});
        });
}


function cutDataURL(lu, id) 
{
    var MAXSIZEURL = 4096;
    var retval;
    if(_.size(lu) > MAXSIZEURL) {
        var i = lu.indexOf(';');
        if(i !== -1) {
            retval = lu.substring(0, i);
        } else {
            retval = lu.substring(0, 30) + '…';
        }
        debug("rr %d url get shortened as %s [long %d]",
            id, retval, _.size(lu));
        return retval;
    }
    /* smaller dataurl are kept */
    return lu;
};

function cookieDissect(memo, block) {
    var separator = block.indexOf('=');
    if(separator !== -1) {
        var key = _.trim(block.substring(0, separator));
        var value = block.substring(separator +1, _.size(block));

        if(key === 'expires')
            value = new Date(value);

        _.set(memo, key, value);
    } 
    else {
        if(!memo.flags)
            memo.flags = [];

        var flag = _.trim(block);

        if(_.size(flag))
            memo.flags.push(flag);
    } 
    return memo;
}

function manageCookies(memo, cookie) {
    var cookieinfo = _.reduce(cookie.split(';'), cookieDissect, {});
    memo.push(cookieinfo);
    return memo;
}

function dissectHeaders(memo, hdr) {

    /* TODO: fare special, set-Cookie e le date, vanno parsate */
    var standards = ['Content-Length', 'Content-Size', 'Content-Type', 'ETag', 'Server' ];
    var dates = [ 'Expires', 'Date', 'Last-Modified' ];
    var ignored = [ 'Vary', 'Content-Encoding', 'Connection', 'Accept-Ranges', 'Set-Cookie'];

    if(hdr.name === 'Set-Cookie') {
        memo.cookies = _.reduce(hdr.value.split("\n"), manageCookies, []);
        return memo;
    }

    if(ignored.indexOf(hdr.name) !== -1)
        return memo;

    if(dates.indexOf(hdr.name) !== -1) {
        memo.standardHeaders[hdr.name] = new Date(hdr.value);
        return memo;
    }

    if(standards.indexOf(hdr.name) !== -1) {
        var tryInt = _.parseInt(hdr.value);

        if(_.isNaN(tryInt))
            memo.standardHeaders[hdr.name] = hdr.value;
        else
            memo.standardHeaders[hdr.name] = tryInt;

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
    var surl = cutDataURL(rr.url, id);

    if(_.isUndefined(memo[id])) {
        /* is the request */

        memo[id] = {
                url: surl,
                requestTime: new Date(moment(rr.when).toISOString())
        };
        if(rr.method === "POST") {
            memo[id].post = true;
            memo[id].postContent = rr;
        }

        /* if is not the first object, don't save phantom and disk 
         * because they are just the same */
        if(id === 1) {
            memo[id].target = true;
        } else {
            memo[id] = _.omit(memo[id], ['phantom', 'disk' ]);
        }

    } else /* is the response: status 'start' or 'end' */ {

        if(rr.stage === "end") {
            // debug("Skipping 'end' %s %s", memo[id].url, rr.url);
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
            proprietaryHeaders: [],
            cookie: null
        });

        // debug("standardHeaders: %s", JSON.stringify(h.standardHeaders, undefined, 2));

        memo[id] = _.extend(memo[id], {
            urlId: urlId,
            domainId: domainId,
            relationId: relationId,
            proprietary: h.proprietaryHeaders
        });
        memo[id] = _.extend(memo[id], h.standardHeaders);
        if(h.cookies)
            memo[id].cookies = h.cookies;
    }

    // debug("%d ID %d %s", i, id, JSON.stringify(memo[id], undefined, 2));
    return memo;
};

module.exports = {
    serializeList: serializeList,
    shrinkMeanings: shrinkMeanings,
    readReport: readReport,
    dissectHeaders: dissectHeaders,
    cutDataURL: cutDataURL,
    cookieDissect: cookieDissect,
    manageCookies: manageCookies,
    phantomCleaning: phantomCleaning
};
