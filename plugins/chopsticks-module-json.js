
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.json'),
    moment = require('moment'),
    fs = require('fs'),
    phIOimport = require('../lib/phantomutils'),
    dirToJson = require('dir-to-json');

Promise.promisifyAll(fs);

var recursiveLook = function(objectWithChild, basePath, siteFilter)
{
    var p = objectWithChild.path,
        nextP = ( (p.split("/").length - 1) > 1) ? (basePath + "/" + p) : basePath,
        retVal = "";

    if (objectWithChild.type === "file") {
        if (_.endsWith(objectWithChild.name, '.json')) {
            if (siteFilter !== "" ) {
                if (nextP.indexOf(siteFilter) !== -1) {
                    debug("sitefilter %s in %s", siteFilter, objectWithChild.name);
                    retVal += nextP + ",";
                } else {
                    debug ("Ignored website path %s because has not the pattern %s", nextP, siteFilter);
                }
            }
            else  {
                retVal += nextP + ",";
            }
        }
    } else { /* is a directory, then, recursion */
        _.each(objectWithChild.children, function(elem) {
            retVal += recursiveLook(elem, nextP, siteFilter) + ",";
        });
    }
    return retVal;
};

module.exports = function(datainput) {

    var sourceDir = process.env.JSON_SOURCE + "/" + process.env.JSON_DETAIL;
    debug("reading from directory %s", sourceDir);

    return dirToJson( sourceDir)
        .then( function( dirTree ) {
            var jsonIoList = recursiveLook(dirTree, sourceDir, process.env.JSON_SITEFILTER)
                .split(",");
            return _.remove(jsonIoList, function(e) { return e !== ""; });
        })
        .catch( function( err ){
            throw err;
        })
        .then(function(jsonFiles) {
            debug("found %d phantom/JSON output files to be imported...", jsonFiles.length);
            return Promise.map(jsonFiles, phIOimport.importJson);
        })
        .then(function(scanData) {
            /* rebuild the envelope properly */
            return {
                companies: datainput.source,
                source: [],
                data: scanData,
                stats: datainput.stats
            }
        })
        .tap(function(debugCnt) {
            debug ("writing! /tmp/module-json-ret.json");
            return fs.
                writeFileAsync("/tmp/module-json-ret.json", JSON.stringify(debugCnt, undefined, 2));
        });
};

module.exports.argv = {
    'json.source': {
        nargs: 1,
        type: 'string',
        default: 'tempdump',
        desc: 'Read URL directories from this directory.'
    },
    'json.detail': {
        nargs: 1,
        type: 'string',
        default: moment().format('YYMMDD')
    },
    'json.sitefilter': {
        nargs: 1,
        type: 'string',
        default: "",
        desc: 'Filter string for file (e.g. "vice".)'
    }
};