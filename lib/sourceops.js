var _ = require('lodash'),
    winston = require('winston'),
    mongodb = require('./mongodb'),
    debug = require('debug')('lib.sourceops'),
    moment = require('moment');

var buildLongTermQuery = function(sites, numberofdays) {
    var theDay = _.parseInt(moment().subtract(numberofdays, 'days').format('YYMMDD')),
        hash_list = _.pluck(sites, 'input_hash');
    return { input_hash : { $in: hash_list }, when: { $gt: theDay} };
};

var buildDailyQuery = function(sites, day) {
    return { input_hash : { $in : _.pluck(sites, 'input_hash') }, when : day };
};

var subjectDay = function(sources) {
  /* well, in theory we can check every .when to be the same, 
   * not a risk right now */
    if ( _.last(sources).when !== _.first(sources).when ) {
        console.error("Unexpected usage, committing from two different tests ?");
        throw new Error("This is very dramatic, you see ? debug place");
    }
    return _.first(sources).when;
};

var storeDailyTests = function(sourcesC, sources) {
  /* ths goal here is get all the sources and don't commit the tests 
   * of the same day again */
    var hash_list = _.pluck(sources, 'input_hash'),
        day = subjectDay(sources),
        retVal = { dup: -1, stored: -1 },
        query = buildDailyQuery(sources, day);

    return mongodb
        .find(sourcesC, query)
        .then(function(entries) {
            retVal.dup = _.size(entries);
            debug("storeDailyTests: duplicated entries of %s: %d/%d", 
                day, retVal.dup, _.size(sources) );

            _.each(entries, function(exist, a) {
                _.remove(sources, function(offered) {
                    return (offered.input_hash === exist.input_hash);
                });
            });

            if(_.size(sources) === 1) {
                debug("WTF 1 ? -------------------------------------");
                console.log(JSON.stringify(sources, undefined, 2));
            }

            return mongodb
                .insert(sourcesC, sources)
                .tap(function(added) {
                    retVal.stored = _.size(added);
                    winston.info("Stored %d new Tests (sources).", retVal.stored);
                });
        })
        .delay(2000)
        .return(retVal);
};

module.exports = {
    buildLongTermQuery: buildLongTermQuery,
    buildDailyQuery: buildDailyQuery,
    subjectDay: subjectDay,
    storeDailyTests: storeDailyTests
};
