var _ = require('lodash'),
    Promise = require('bluebird'),
    fs = require('fs'),
    domainTLDinfo = require('../lib/domain').domainTLDinfo,
    debug = require('debug')('lib.importer'),
    jsonReader = require('./jsonfiles').jsonReader,
    isPercentage = require('./utils').isPercentage;

Promise.promisifyAll(fs);


var pickSize = function(headers, phantEstmSize) {
    var hdrCL = _.find(headers, {name: "Content-Length"}),
        retVal = (hdrCL === undefined) ? phantEstmSize : (hdrCL.value * 1);

    if(retVal !== phantEstmSize && phantEstmSize > 0) {
        /*
        debug("Anomaly ? Content-Lenght and bodySize differs");
        console.log(JSON.stringify(hdrCL, undefined, 2));
        console.log(phantEstmSize);
         */
    }
    if(retVal === null) {
        debug("Lenght without having a proper size ? (phantom %s)", phantEstmSize);
        console.log(JSON.stringify(headers, undefined, 2));
    }
    return retVal;
};

var pickRedirect = function(headers, phantEstmRedir) {
    /* this is so-say-"correct", I'm taking the location uppercase or lowercase */
    var hdrL = _.find(headers, {name: "Location"}),
        hdrL = _.find(headers, {name: "location"}) ?
               _.find(headers, {name: "location"}) :
                hdrL,
        retVal = (hdrL === undefined) ? phantEstmRedir : hdrL.value;

    if(phantEstmRedir && retVal !== phantEstmRedir && phantEstmRedir.length > 0) {
        /*
        debug("Anomaly ? location and redirectURL differs");
        console.log(JSON.stringify(hdrL, undefined, 2));
        console.log(phantEstmRedir);
         */
    }
    if(retVal === null || retVal.length === 0) {
        /*
        debug("Redirect without having a proper redirect URL ?");
        console.log(JSON.stringify(headers, undefined, 2));
         remind: you've checked when happen, there are not enough info
            in the phantom answer */
        return null;
    }
    return retVal;
};

var pickContent = function(headers, phantEstCT) {

    var hdrCT = _.find(headers, {name: "Content-Type"}),
        composedVal = (hdrCT === undefined) ? phantEstCT : hdrCT.value;
    if (composedVal === undefined) {
        debugger;
    }

    if(composedVal == null || composedVal.length === 0) {
        return null;
    }
    var retVal = (composedVal.indexOf(';') != -1) ?
                  composedVal.split(';')[0] : composedVal,
        replacedCT = {
          "application/javascript": "javascript",
          "image/icon": "image/vnd.microsoft.icon",
          "application/vendor-specific": "application/vnd.",
          "application/x-amz-json": "application/x-amz-json-",
          "text/manifest": ".manifest",
          "app/fireclick": "app/fireclick."
        };
        /* This is necessary also because in MongoDB keys can't have "." inside */

    _.each(replacedCT, function(v, k) {
        if (_.endsWith(retVal, v))
            retVal = k;
        if (_.startsWith(retVal, v))
            retVal = k;
    });

    if(retVal.search(/\./) !== -1) {
        debug("** %s", retVal);
        retVal = retVal.replace(/\./g, /_/);
    }
    if(_.startsWith(retVal, '$')) {
        var ctFixer = "image/mime";
        debug("Strange content-type %s forced to be %s", retVal, ctFixer);
        retVal = ctFixer;
    }
    return retVal;
};

var requestResponseMap = function(resReqL) {
    var reqresMap = {};
    _.each(resReqL, function(resReq) {

        if (typeof resReq.Request === 'object' && _.startsWith(resReq.Request.url, 'http')) {
            var cleanHref = _.trunc(resReq.Request.url, {length: 2000}),
                param = cleanHref.indexOf('?'),
                urlSize = _.size(resReq.Request.url);
            cleanHref = (param != -1) ? cleanHref.substr(0, param) : cleanHref;

            reqresMap[resReq.Request.id] = {
                href: cleanHref,
                urlSize: urlSize,
                type: "inclusion",
                contentType: null,
                httpCode: null,
                bodySize: -1,
                start: resReq.When,
                end: null,
                status: "pending",
                redirect: null,
                phantom_id: resReq.Request.id
            };
        }
        else if (typeof resReq.Response === 'object' && _.startsWith(resReq.Response.url, 'http')) {
            var id =+ resReq.Response.id;

            reqresMap[id].httpCode = resReq.Response.status;
            reqresMap[id].phantom_id += "," + id;
            reqresMap[id].end = resReq.When;

            if (("" + resReq.Response.status)[0] === '3') {
                reqresMap[id].status = "redirected";
                reqresMap[id].redirect = pickRedirect(resReq.Response.headers,
                    resReq.Response.redirectURL);
            } else if(("" + resReq.Response.status)[0] === '2') {
                reqresMap[id].status = "complete";
                reqresMap[id].contentType = pickContent(resReq.Response.headers,
                    resReq.Response.contentType);
                reqresMap[id].bodySize = pickSize(resReq.Response.headers,
                    resReq.Response.bodySize);
            } else if(("" + resReq.Response.status)[0] === '4') {
                reqresMap[id].status = "error";
            } else {
                reqresMap[id].status = "empty";
            }
        }
    });

    /* the key that are null are not saved: they waste space! */
    _.each(reqresMap, function(rr, id) {
        _.each(rr, function(content, key) {
            if (content == null) {
                // console.log("Cleaning " + key + "from " + JSON.stringify(rr, undefined, 3));
                delete rr[key];
            }
        })
    })
    return domainTLDinfo(reqresMap);
};

var checkPresence = function(fileName) {
    return fs
        .statAsync(fileName)
           .then(function(presence) {
                return true;
            })
            .catch(function(error) {
                return false;
            });
};

var computeStats = function(fileEntry) {
    var successRatio = _.countBy(_.map(fileEntry.rr, function(sb) {
            return sb.status;
    })),
        contentRatio = _.countBy(_.map(fileEntry.rr, function(sb) {
            return sb.contentType;
    }));
    fileEntry.stats = {
        'status' : successRatio,
        'content': contentRatio,
        'requests': _.size(fileEntry.rr)
          /* TODO: count the non-primary domain requests */
    };
    return fileEntry;
};

var importLog = function(fileEntry, cnt, total) {
    return jsonReader(fileEntry.logFile, fileEntry.debugName)
        .then(function(execContent) {
            fileEntry.fetchInfo = execContent;
            return fileEntry;
        })
        .tap(function() {
            if(isPercentage(cnt, total, 10))
                debug('Log Import: %d/%d (%d%%)', 
                    cnt, total, _.round(((cnt/total)*100), 1));
        });
};

var importPhantput = function(fileEntry, cnt, total) {
    return jsonReader(fileEntry.phantomFile, fileEntry.debugName)
        .then(function(contentIOList) {
            fileEntry.rr = _.values(requestResponseMap(contentIOList));
            return fileEntry;
        })
        .tap(function() {
            if(isPercentage(cnt, total, 10))
                debug('Phantom Import: %d/%d (%d%%)',
                    cnt, total, _.round(((cnt/total)*100), 1));
        });
};

module.exports = {
    importLog: importLog,
    importPhantput: importPhantput,
    checkPresence: checkPresence,
    computeStats: computeStats
};
