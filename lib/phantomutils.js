var _ = require('lodash'),
    Promise = require('bluebird'),
    fs = require('fs'),
    debug = require('debug')('lib.phantomutils');

Promise.promisifyAll(fs);

/*
The data actually kept is, for every connection:
{
    href : url-requested
    type : inclusion
    contentType :
    httpCode :
    size :
    start :
    end :
    status : complete | hanged | redirected
    redirect :
}
This function transform a collection of Request and Response in a coherent
simplify summary of every http request.
 */
var requestResponseMap = function(rrOL) {
    var reqresMap = {},
        retVal = [];
    _.each(rrOL, function(rrO) {
        if (typeof rrO.Request === 'object') {
            reqresMap[rrO.Request.id] = {
                href: _.trunc(rrO.Request.url, { length: 2000 }),
                type: "inclusion",
                contentType: null,
                httpCode: null,
                bodySize: -1,
                start: rrO.When,
                end: null,
                status: "pending",
                redirect: null
            }
        }
        if (typeof rrO.Response === 'object') {
            var id =+ rrO.Response.id,
                _tmpo = _.find(rrO.Response.headers, {name: "Content-Length"}),
                size1 =+ (_tmpo === undefined) ? 0 : (_tmpo.value * 1),
                size2 =+ rrO.Response.bodySize;
            reqresMap[id].contentType = rrO.Response.contentType;
            reqresMap[id].httpCode = rrO.Response.status;
            reqresMap[id].bodySize = (size1 > reqresMap[id].bodySize) ? size1 :reqresMap[id].bodySize;
            reqresMap[id].end = rrO.When;
            reqresMap[id].status = (rrO.Response.redirectURL === null) ? "complete" : "redirected";
            reqresMap[id].redirect = rrO.Response.redirectURL;
        }
    });
    _.each(reqresMap, function(rr, id) {
        retVal = retVal.concat(rr);
    });
    return retVal;
};


var importJson = function(jsonFile) {

    debug("Operating over %s", jsonFile);

    return fs
        .readFileAsync(jsonFile, "utf-8")
        .then(function(content) {
            return JSON.parse(content);
        })
        .then(function(contentIOList) {
            return requestResponseMap(contentIOList);
        })
        .then(function(reqResMap) {
            return {
                'file': jsonFile,
                'rr': reqResMap
            }
        });
};

module.exports = {
    importJson: importJson
};
