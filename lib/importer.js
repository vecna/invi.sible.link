var _ = require('lodash'),
    Promise = require('bluebird'),
    fs = require('fs'),
    domain = require('../lib/domain'),
    debug = require('debug')('lib.importer');

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
    phantom_id :
}
This function transform a collection of Request and Response in a coherent
simplify summary of every http request.
 */

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
    /*
    if(phantEstCT && retVal !== phantEstCT && phantEstCT.length > 0) {
        debug("Anomaly ? content type differs");
        console.log(JSON.stringify(hdrCT, undefined, 2));
        console.log(phantEstCT);
    } */
    return retVal;
};


var requestResponseMap = function(resReqL) {
    var reqresMap = {},
        retVal = [];
    _.each(resReqL, function(resReq) {

        if (typeof resReq.Request === 'object') {
            reqresMap[resReq.Request.id] = {
                href: _.trunc(resReq.Request.url, {length: 40}), // 2000

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
        else if (typeof resReq.Response === 'object') {
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

    _.each(reqresMap, function(rr, id) {
        retVal = retVal.concat(
            domain.domainDetails(rr))
    });
    return retVal;
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
        'inclusions': _.size(inclusionMap)
    };
};

var importJson = function(jsonFile) {

    debug("Importing %s", jsonFile);

    return fs
        .readFileAsync(jsonFile, "utf-8")
        // .tap(function(DS) { debug("Bytes from %s are %d", jsonFile, DS.length); })
        .then(function(content) {
             return JSON.parse(content);
        })
        .then(function(contentIOList) {
            return requestResponseMap(contentIOList);
        })
        .then(function(inclusionRetVal) {
            return {
                'rr': inclusionRetVal,
                'stats': theStats(inclusionRetVal)
            }
        })
        .then(function(doubleinfo) {
            doubleinfo.file = jsonFile;
            return doubleinfo;
        });
        /*
        .tap(function(importJsonOut) {
            debug ("writing! /tmp/importJsonOut.json");
            return fs.writeFileAsync("/tmp/importJsonOut.json",
                JSON.stringify(importJsonOut, undefined, 2));
        }); */
};

module.exports = {
    importJson: importJson
};

/*
.tap(function(reusInp) {
    debug ("writing! /tmp/reusInp.json");
    return fs.writeFileAsync("/tmp/reusInp.json", JSON.stringify(reusInp, undefined, 2));
})
*/
