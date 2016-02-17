var _ = require('lodash'),
    Promise = require('bluebird'),
    fs = require('fs'),
    domainTLDinfo = require('../lib/domain').domainTLDinfo,
    debug = require('debug')('lib.importer'),
    jsonReader = require('./jsonfiles').jsonReader;

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
                  composedVal.split(';')[0] : composedVal;

    if (_.endsWith(retVal, 'javascript')) {
        retVal = "application/javascript"
    }
    /*
    if(phantEstCT && retVal !== phantEstCT && phantEstCT.length > 0) {
        debug("Anomaly ? content type differs");
        console.log(JSON.stringify(hdrCT, undefined, 2));
        console.log(phantEstCT);
    } */
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

var theStats = function(inclusionMap) {
    var successRatio = _.countBy(_.map(inclusionMap, function(sb) {
            return sb.status;
    })),
        contentRatio = _.countBy(_.map(inclusionMap, function(sb) {
            return sb.contentType;
    }));
    return {
        'status' : successRatio,
        'content': contentRatio,
        'requests': _.size(inclusionMap)
          /* TODO: count the non-primary domain requests */
    };
};

var importJson = function(jsonFile) {
/* This is the only exported function, import the phantomJS log
 * (the filename YYMMDD.json) and also the executions.log */
    var execlogF = jsonFile.substr(0, jsonFile.length - 11) + 'executions.log';

    return jsonReader(jsonFile)
        .then(function(contentIOList) {
            return requestResponseMap(contentIOList);
        })
        .then(function(inclusionRetVal) {
            return jsonReader(execlogF)
                .then(function(execContent) {
                    return {
                        log: execContent,
                        file: jsonFile,
                        rr: inclusionRetVal,
                        stats: theStats(inclusionRetVal)
                    }
                });
        });

};

module.exports = {
    importJson: importJson
};
