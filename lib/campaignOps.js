var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:campaignOps');
var crypto = require('crypto');
var nconf = require('nconf');

var urlutils = require('./urlutils');
var mongo = require('./mongo');

function pickLastHours(filter, hours)  {

    var last = moment().subtract(hours, 'h').format("YYYY-MM-DD HH:mm:SS");
    filter = _.extend(filter, {
        when : { "$gt": new Date(last) } 
    });

    debug("pickLastHours (%d) from suface, filter %j", hours, filter);
    return mongo
        .read(nconf.get('schema').surface, filter);

};

function tableReduction(coll) {
    var kept = [ 'url', 'needName', 'VP', 'unique', 'javascripts', 'when' ];
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

    var last = moment().subtract(36, 'h').format("YYYY-MM-DD HH:mm:SS");
    filter = _.extend(filter, {
        when : { "$gt": new Date(last) } 
    });

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

        var trackingDomain = urlutils.urlToDomain(e.url);

        /* this us used only for numering reason */
        if(memo.unique.indexOf(e.domainId) === -1) {
            console.log(memo.unique);
            memo.unique.push(e.domainId);
        }

        memo.sites[e.subjectId][trackingDomain] = memo.unique.indexOf(e.domainId);

        return memo;

    }, { sites: {}, unique: [] });

    /* not keep only the top 10 */
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

module.exports = {
    pickLastHours: pickLastHours,
    tableReduction: tableReduction,
    getEvidences: getEvidences,
    rankEvidences: rankEvidences
};
