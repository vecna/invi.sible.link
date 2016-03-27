var _ = require('lodash'),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs'));
    require('fs'),
    debug = require('debug')('lib.jsonfiles'),
    moment = require('moment');


var jsonReader = function(sourceFile, debugName) {
    debugName = (_.isUndefined(debugName)) ? sourceFile : debugName;
    return fs
        .readFileAsync(sourceFile)
        .then(function(jsonString) {
            return JSON.parse(jsonString);
            // debug("jsonReader %d entries from %s", _.size(parsed), debugName);
        })
        .catch(function(e) {
            if(e.code !== 'ENOENT') 
                debug("Unable to load %s: %s", sourceFile, e.message);
            return null;
        });
};

var usedLocation = function()
{
    var now = moment(),
        retVal = now.format('YYMMDD');
    if(process.env.FROMLIST_DETAILS) {
      retVal = process.env.FROMLIST_DETAILS;
    } else if(process.env.FROMLIST_DAY !== "0") {
      retVal = moment(now-(process.env.DISKCHECK_DAY*24*3600*1000)).format('YYMMDD');
    }
    return _.parseInt(retVal);

}

var fileStruct = function(location, fname) {
    return {
        dom: location + fname + '.html',
        timeout: location +  fname +".timeout",
        render: location +  fname +'.jpeg',
        io: location +  fname +'.json',
        text: location +  fname +'.txt',
        headers: location +  fname +'.head'
    };
};

var directoryStruct = function(links, diskPath) {
    /* why isn't working the targetHref in this way ?
    _.find(links, function(u) { return u.type == "target"; }), */
    diskPath = (_.endsWith(diskPath, "/")) ? diskPath : diskPath + "/";

    /* Remind: this is used in urlops, usedLocation above is a mix between JSON and URLOPS vars */
    var timeString = usedLocation(),
        targetHref = links[0],
        shortHash = _.trunc(targetHref._ls_id_hash, { length: 6, omission: '' }),
        host = targetHref.host,
        location = diskPath + timeString + "/" + host + "/" + shortHash + "/";

    return {
        timeString: timeString,
        location: location
    };
};

module.exports = {
    jsonReader: jsonReader,
    directoryStruct: directoryStruct,
    fileStruct: fileStruct
};
