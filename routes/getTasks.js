var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('getList');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var subjectsOps = require('../lib/subjectsOps');
var prand = require('../lib/pseudoRandom');

/* this function is constantly called, like, every minute, 
 * through this function might be possible organize a coordinated
 * test to the same site in the same moment from N-vantage points */
function getTasks(req) {

    /* cambiare a post ? */
    var agentName = req.params.agentName;
    var agentInfo = req.params.agentInfo || "amen";
    var referenceTime = moment().subtract(1, 'd');

    debug("%s %s (%s) asks getTasksId since %s",
        req.randomUnicode, agentName,
        agentInfo, referenceTime.toISOString() );

    return mongo
        .read(nconf.get('schema').subjects)
        .then(prand.getPseudoRandomSample)
        .map(subjectsOps.getSites)
        .then(prand.getPseudoRandomSample)
        .then(function(siteList) {
            return {
                json: siteList
            };
        });
};

    /*
     * Avere la lista di test collezionati e fare una sottrazione, per
     * far si che chopstick possa loopare su tutto
    return mongo
        .read(nconf.get('schema').promises, {
            "$lt": new Date(moment().subtract(1, 'd')),
            "agent": agentName
        })
        .then(function(lists) {
            return {
                json: subjectsOps.serializeLists(lists)
            };
        });

    return mongo
        .read(nconf.get('schema').subjects, {
            'public': true
        })
        .then(function(lists) {
            return {
                json: subjectsOps.serializeLists(lists)
            };
        });
    */

module.exports = getTasks;
