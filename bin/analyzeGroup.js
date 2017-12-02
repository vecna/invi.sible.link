#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('bin:analyzeGroup');

var moment = require('moment');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');

var tname = promises.manageOptions();
var daysago = nconf.get('DAYSAGO') ? _.parseInt(nconf.get('DAYSAGO')) : 0;

/* still to be decided how to clean this */
var whenD = nconf.get('DAYSAGO') ? 
    new Date() : 
    new Date(moment().subtract(_.parseInt(nconf.get('DAYSAGO')), 'd'));

/* code begin here */
function saveAll(content) {
    if(content) {
        debug("Saving in results the product in 'judgment' table");
        return machetils.statsSave(nconf.get('schema').judgment, content);
    }
    else
        debug("No output produced");
}

function getEvidenceAndDetails(daysago, target) {


    return loadJSONurl(url);

    nconf.argv().env();
    nconf.file({ file: nconf.get('config') });
    daysago = _.parseInt(daysago) || 0;

    var when = moment().startOf('day').subtract(daysago, 'd');
    var min = when.toISOString();
    var max = when.add(25, 'h').toISOString();

    debug("looking for 'surface' and 'details' %d days ago [%s-%s] campaign %s",
        daysago, min, max, target);

    var filter = {
        "when": { "$gte": new Date( min ), 
                  "$lt": new Date( max ) },
        "campaign": target
    };

    return Promise.all([
        mongo.read(nconf.get('schema').surface, filter),
        mongo.read(nconf.get('schema').details, filter)
    ])
};


function rankTheWorst(m) {
    /* the current concept of "worst" is pretty experimental, there
     * is not a scientifical measurement on which network behavior
     * causes the bigger damage to privacy/security, but this is 
     * a metric in which research and investigations can provide 
     * input. The output object is:
     *  - name (the url)
     *  - totalNjs (total number of js)
     *  - post (if XMLHttpRequest has triggered some POST)
     *  - canvas
     *  - reply session
     *  - storage (indexDB or localStorage) usage
     *  - companies number
     *  - total "score" still to be done well
     * */

    /* use summary as reference, extend the info there with the
     * associated evidences */
    var ev = _.groupBy(m[0], 'subjectId');
    var det = _.groupBy(m[1], 'subjectId');

    /* this function just aggregate the results obtain from
     * different sources. evidences and details, now we can get 
     * a complex object with all the results
     */
    var mixed = [];

    _.each(m[0], function(evidence) {
        _.find(mixed, { name: 
    });

    debugger;
    var rank = _.map(_.keys(det), function(sid) {
        var e = ev[sid];
        var d = det[sid];
        var companies = _.countBy(_.filter(e, 'company'), 'company')
        var traces = _.size(d);
        debug("%d %j", traces, companies);
        return {
            companies: companies,
            traces: traces,
            subjectId: sid
        };
    });
    debugger;
};

function computeStatus(both) {
    /* position 0, `today`, position 1, `today -1` */
};

return getEvidenceAndDetails(daysago, tname)
    .then(rankTheWorst)
    .then(function(fr) {
        debugger;
        // getEvidenceAndDetails(daysago-1, tname).then(rankTheWorst)
    })
/*
Promise.all([
    ])
    .then(computeStatus)
    .tap(function(result) {
        debug("Operations completed");
    });
*/
