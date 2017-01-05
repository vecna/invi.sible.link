var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('lib:machetils');
var moment = require('moment');

var mongo = require('../lib/mongo');
var plugins = require('../plugins/machete');

function infoObj(nome) {
    return {
        'name': nome,
        'when': new Date()
        /* other info if needed */
    };
};

// val = { 
//   .logic
//   .sources 
//   .init <-- from initialize
//   .timings = [ .append infoObj ]
//   .download = content downloaded N timex = sources
//   .data (remove .downloads)
//   .finished }

function initialize(logic, servers) {

    debug("Initialize with servers: %j", servers);
    var retVal = {
        sources: _.reduce(servers, function(memo, S) {
            memo[S.name] = S.host;
            return memo;
        }, {}),
        logic: logic
    };

    if(logic.chain.pickFromCore) {
        debug("Initalize calling machete/plugin %s",
            logic.chain.pickFromCore);

        return plugins[logic.chain.pickFromCore](logic)
            .then(function(initdata) {
                retVal.init = initdata;
                retVal.timings = [ infoObj('initialize') ];
                return retVal;
            });
    } else {
        retVal.timings = [ infoObj('initialize') ];
        return Promise
            .resolve()
            .return(retVal);
    }
};

/* this has to change against mass fetches */
function fetchFrom(source, val, i) {
    debugger;
    var url = val.sources[source] + '/api/v1/' + val.logic.chain.fetch;
    debug("Querying URL %s (%d)", url, i);
    return request
        .getAsync(url)
        .then(function(response) {
            return JSON.parse(response.body);
        })
        .then(function(content) {
            return download = { 
                source: source,
                url: url,
                data: content,
                timing: infoObj('fetch ' + source),
                val: val
            };
        })
        .catch(function(error) {
            debug("Error in connecting to %s", url);
            val.download = {
                source: source,
                url: url,
                data: [],
                timing: infoObj('error in fetch ' + source),
                val: val
            };
            return val;
        });
};

function singleProcess(dload) {
    if(dload.val.logic.chain.singleProcess) {
        debug("Entering in singleProcess %s for each entry (this is %s)",
            dload.val.logic.chain.singleProcess, dload.val.download.timing.name);

        return plugins[dload.val.logic.chain.singleProcess](dload)
            .then(function(updated) {
                updated.timings.push(infoObj('singleProcess'));
                return updated;
            });
    }
    else {
        debug("No singleProcess in %s", dload.val.logic.name);
        return dload;
    }
};

function compactList(dloads) {
    var retVal = dloads[0].val;
    if( _.size(dloads) === 1 ) {
        debug("compactList of 1 element: simply return the first element");
        retVal.data = [{ data: dloads[0].data, url: dloads[0].url, source: dloads[0].source }]
    } else {
        debug("compactList operating over %d elements", _.size(dloads) );
        retVal.data = [];
        _.each(dloads, function(e) {
            retVal.data.push({data: e.data, url: e.url, source: e.source });
        });
    }
    return retVal;
};

function collectiveProcess(val) {

    if(val.logic.chain.collectiveProcess) {
        debug("Executing collectiveProcess %s",
            val.logic.chain.collectiveProcess);
        return plugins[val.logic.chain.collectiveProcess](val)
            .then(function(updated) {
                updated.timings.push(infoObj('collectiveProcess'));
                return updated;
            });
    } else {
        debug("No collectiveProcess");
        return val;
    }
};

module.exports = {
    compactList: compactList,
    singleProcess: singleProcess,
    fetchFrom: fetchFrom,
    initialize: initialize,
    collectiveProcess: collectiveProcess
};
