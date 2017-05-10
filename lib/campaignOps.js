var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:campaignOps');
var crypto = require('crypto');
var nconf = require('nconf');

var urlutils = require('./urlutils');
var mongo = require('./mongo');

function pickLastHours(filter, hours)  {

    var last = moment().subtract(hours, 'h').format("YYYY-MM-DD");
    filter.when = { "$gt": new Date(last) };

    return mongo
        .read(nconf.get('schema').surface, filter);

};

function tableReduction(coll) {
    var kept = [ 'url', 'needName', 'VP', 'unique', 'javascripts', 'when', 'companies' ];
    if(!_.size(coll))
        return [];
    var ret = _.reduce(coll, function(memo, e) {
        var r = _.pick(e, kept);
        if(r.javascripts)
            memo.push(r);
        return memo;
    }, []);
    debug("tableReduction pick %d fields, from %d entries remain %d sites",
        _.size(kept), _.size(coll), _.size(ret));
    return ret;
};

function getEvidences(filter) {

    /* 36 hours hardcoded */
    var last = moment().subtract(36, 'h').format("YYYY-MM-DD");
    filter.when = { "$gt": new Date(last) };

    return mongo
        .read(nconf.get('schema').evidences, filter);
};


function rankEvidences(evs) {

    var numberOf = 5;

    /* this return the number of unique JAVASCRIPT per source, capped to numberOf,
     * and the code might seem unneedlessy complicated  */
    debug("rankEvidences operate over %d entries", _.size(evs));
    var scripts = _.reduce(evs, function(memo, e) {

        if(!(e['Content-Type'] && e['Content-Type'].match('script')))
            return memo;

        if(!memo.sites[e.subjectId]) {
            /* the value of this fill feed c3 */
            memo.sites[e.subjectId] = { url: e.href };
        }

        if(e.target)
            return memo;

        var trackingDomain = e.domaindottld.replace(/\./g, '•');

        /* this us used only for numering reason */
        if(memo.unique.indexOf(e.relationId) === -1)
            memo.unique = _.concat(memo.unique, e.relationId);

        /* debug, solo per averne di meno */
        memo.sites[e.subjectId][trackingDomain] = memo.unique.indexOf(e.relationId);
        /* if(memo.unique.indexOf(e.relationId) < 20) {
            memo.sites[e.subjectId][trackingDomain] = memo.unique.indexOf(e.relationId);
        } */

        return memo;

    }, { sites: {}, unique: [] });

    /* keep only the tops */
    var ranked = _.slice(_.reverse(_.orderBy(_.values(scripts.sites), _.size)), 0, numberOf);

    var trackers = _.reduce(ranked, function(memo, c3blob) {
        _.each(_.keys(_.omit(c3blob, ['url'])), function(domain) {
            if(memo.indexOf(domain) === -1)
                memo.push(domain);
            });
        return memo;
    }, []);

    return {
        content: ranked,
        trackers: trackers
    };
};

/* This output looks like the one above, but is about companies name */
function rankByTracks(surfL) {
    var numberOf = 30;

    /* this return the number and the name of Companies */
    debug("rankByTracks over %d entries", _.size(surfL));

    var ranked = _.reverse(_.orderBy(surfL, function(se) {
        return _.size(se.companies);
    }));

    /* if you want to chunk it, this: */
    return _.slice(ranked, 0, numberOf);
};

/* if we've two or more test from the same subject, display only
 * the one with more third party trackers */
function keepTheWorstTest(mixedL) {

    return _.reduce(mixedL, function(memo, test) {
        var exists = _.find(memo, { subjectId: test.subjectId });

        if(exists) {
            if( _.size(exists.companies) < _.size(test.companies) ) {
                debug("keepTheWorstTest proven be useful with %s", test.url);
                memo = _.reject(memo, { subjectId: test.subjectId });
                memo.push(test);
            }
        } else {
            memo.push(test);
        }
        return memo;
    }, []);

};

module.exports = {
    pickLastHours: pickLastHours,
    tableReduction: tableReduction,
    getEvidences: getEvidences,
    rankEvidences: rankEvidences,
    rankByTracks: rankByTracks,
    keepTheWorstTest: keepTheWorstTest
};
