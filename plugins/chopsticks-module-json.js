
var _ = require('lodash'),
    Promise = require('bluebird'),
    debug = require('debug')('plugin.json'),
    moment = require('moment'),
    fs = require('fs'),
    linkIdHash = require('../lib/transformer').linkIdHash,
    domainTLDinfo = require('../lib/fslogic').domainTLDinfo,
    directoryStruct = require('../lib/fslogic').directoryStruct,
    dirToJson = require('dir-to-json');

Promise.promisifyAll(fs);

module.exports = function(datainput) {

    // console.log(JSON.stringify(datainput, undefined, 3));

    var sourceDir = process.env.JSON_SOURCE + "/" + process.env.JSON_DETAIL;
    debug("Reading in directory %s", sourceDir);

    dirToJson( sourceDir)
        .then( function( dirTree ){

            console.log( JSON.stringify(dirTree, undefined, 2) );
        })
        .catch( function( err ){
            throw err;
        });

    return fs
        .readdirAsync(sourceDir)
        .then(function(hostDirs) {

            Promise.map(hostDirs, function(hostDir) {

            })
            fs.readdirAsync()
            /* here is populated a dict only of the proper extensions */
            var fileobj = {};
            _.map(files, function (f) {
                if(f.split('.').pop() == extension)
                /* I don't know if is the good way to "Cast as Int" but the YYMMDDHHmm
                 * became an Int and the we can do ">" check to find the last */
                    fileobj[f] = (f.split('.')[0] * 1);
            });
            return fileobj;
        }).then(function(allthefiles) {
            /* conditions to be managed: only 1 file, only 2, more than 2 */
            _.each(allthefiles, function(incrTime, fname) {
                if (incrTime > retstruct.last.when) {
                    retstruct.previous = {
                        when: retstruct.last.when,
                        fname: retstruct.last.fname
                    };
                    retstruct.last.when = incrTime;
                    retstruct.last.fname = basedir + fname;
                }
            })
        }).return(retstruct);



    return datainput;
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
    }
};