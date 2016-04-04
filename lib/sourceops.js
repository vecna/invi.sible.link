var _ = require('lodash'),
    winston = require('winston'),
    mongodb = require('./mongodb'),
    debug = require('debug')('lib.sourceops'),
    levenshtein = require('levenshtein-edit-distance');
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
   * not a risk right now, and anyway this do not work because sometime
   * is empty, so... 
      if  _.last(sources).when !== _.first(sources).when 
   */
    var retVal = _.first(sources).when;
    if (_.isUndefined(retVal)) {
        throw new Error("This is very dramatic, you see ? debug place");
    }
    return retVal;
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

            return mongodb
                .insert(sourcesC, sources)
                .tap(function(added) {
                    retVal.stored = _.size(added);
                    winston.info("Stored %d new Tests (sources).", retVal.stored);
                });
        })
        .return(retVal);
};

var guessRequestedCategory = function(catList, catreq) {
    return _.first(
        _.sortByOrder(
            _.map(catList, function(cat) {
                return {
                  'category': cat,
                  'distance': levenshtein(catreq, cat)
                };
            }), 
            ['distance'], ['asc']
        )).category;
};

module.exports = {
    buildLongTermQuery: buildLongTermQuery,
    buildDailyQuery: buildDailyQuery,
    subjectDay: subjectDay,
    storeDailyTests: storeDailyTests,
    guessRequestedCategory: guessRequestedCategory
};
