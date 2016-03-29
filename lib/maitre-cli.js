var _ = require('lodash'),
    winston = require('winston'),
    utils = require('./utils'),
    debug = require('debug')('↻ maître'),
    init = require('./init'),
    Promise = require('bluebird'),
    jsonReader = require('./jsonfiles').jsonReader,
    lookup = require('./lookup'),
    sourceops = require('./sourceops'),
    fs = require('fs'),
    yargs = require('yargs'),
    levenshtein = require('levenshtein-edit-distance');
    siteinfo = require('./siteinfo');

yargs.nargs('w', 1)
          .alias('w', 'when')
          .string('w')
          .describe('w', 'days to get, one or more')
      .nargs('m', 1)
          .alias('m', 'howmany')
          .string('m')
          .describe('m', 'how many results?')
      .nargs('k', 1)
          .alias('k', 'category')
          .string('k')
          .describe('k', 'Category')
      .config('c')
      .help('h')
      .alias('h', 'help')
      .demand(['c', 'k', 'w']);

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: true,
    colorize: true
});

argv = (_.reduce([], function(yargs, p) {
  if (p.argv != null) {
    return yargs.options(p.argv);
  } else {
    return yargs;
  }
}, yargs)).argv;

_(argv).pick(function(v, k) {
  return _.isPlainObject(v);
}).each(function(v, k) {
  return _(utils.nestedOption(k, v)).pairs().each(function(e) {
    if (process.env[e[0]] == null) {
      return process.env[e[0]] = e[1];
    }
  }).value();
}).value();

try {
  var mongodb = require('./mongodb').initialize(argv.mongodb.uri);
} catch (error) {
  winston.info('No MongoDB connection string found.');
  return;
}

var sourceC = 'sources',
    unitC = 'units',
    howmany = _.parseInt(argv.m),
    day = _.parseInt(argv.w),
    when = _.parseInt(moment().subtract(day, 'days').format('YYMMDD')),
    category, filteredSite, query;

if (howmany <= 0 || howmany >= 100 || _.isNaN(howmany)) {
    console.log("Invalid value in -m, howmany forced to be 10 (use between 1 and 100)");
    howmany = 10;
}
debug("Looking day %d [%d] for %d results", day, when, howmany);

init
    .initialize(argv.c)
    .then(function(staticInput) {
        category = guessRequestedCategory(staticInput.lists.categories, argv.k);
        debug("Detected %s among %j", category, staticInput.lists.categories);
        filteredSite = lookup.byCategory(staticInput, category);
        debug("The filtered amount of sites are %d", _.size(filteredSite));
        query = sourceops.buildDailyQuery(filteredSite, when);
        return mongodb
            .find(sourceC, query)
            .then(function(siteT) {
                debug("Retrived %d entries from day %d", _.size(siteT), when);
                return siteinfo.surfaceSiteInfo(staticInput, siteT, howmany);
                // return siteinfo.detailSiteInfo(staticInput, siteT);
            })
            .tap(function(sinfo) {
                siteinfo.cliVisual(sinfo);
            });
    });


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

