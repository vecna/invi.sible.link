
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.json'),
    moment = require('moment'),
    fs = require('fs'),
    importer = require('../lib/importer'),
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
    } else { // is a directory, then, recursion
        _.each(objectWithChild.children, function(elem) {
            retVal += recursiveLook(elem, nextP, siteFilter) + ",";
        });
    }
    return retVal;
};



module.exports = function(datainput) {

    var urlMatch = function(jsonPath) {
        /* return True if the json path fit one of the configured-target-website */
        var hash = jsonPath.split('/')[3], retVal = false;
        _.each(datainput.source, function(siteEntry) {
            if ( _.trunc( siteEntry._ls_links[0]._ls_id_hash,
                            { length: 6, omission: '' }) === hash) {
                retVal = true;
            }
        });
        return retVal;
    };

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
            debug("found %d phantom output files, filtering...", jsonFiles.length);
            return _.partition(jsonFiles, urlMatch)[0];
        })
        .tap(function(filterJF) {
            debug("The source specified let kept %d files", filterJF.length);
        })
        /* TODO apply here filter based on .source */
        .then(function(jsonFiles) {
            debug("found %d phantom/JSON output files to be imported...", jsonFiles.length);
            return Promise.map(jsonFiles, importer.importJson);
        })
        .then(function(scanData) {
            return {
                companies: datainput.companies,
                source: datainput.source,
                data: scanData,
                stats: datainput.stats
            }
        })
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