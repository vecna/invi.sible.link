var _ = require('lodash'),
    winston = require('winston'),
    utils = require('./utils'),
    debug = require('debug')('↻ maître'),
    init = require('./init'),
    Promise = require('bluebird'),
    jsonReader = require('./jsonfiles').jsonReader,
    lookup = require('./lookup'),
    queries = require('./queries'),
    fs = require('fs'),
    yargs = require('yargs');

yargs.nargs('w', 1)
          .alias('w', 'what')
          .string('w')
          .choices('w', ['look'])
      .nargs('i', 1)
          .alias('i', 'intersect')
          .string('i')
          .describe('i', 'category,country (one may be empty)')
      .config('c')
      .help('h')
      .alias('h', 'help')
      .demand(['c', 'i']);

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

intersect = argv.i.split(',');

debug("using Intersection of %s", intersect);
var category = "Pornography";
    sourceC = 'sources';
    unitC = 'units';

return init.initialize(argv.c)
    .then(function(staticInput) {
        var filteredSite, query;
        debug("Info, Categories: %j", staticInput.lists.categories);
        filteredSite = lookup.byCategory(staticInput, category);
        debug("The filtered amount of sites are %d", _.size(filteredSite));
        query = queries.buildSourceQuery(filteredSite, 4);
        debug("query = %j", query);
        return mongodb
          .find(sourceC, query)
          .then(function(siteT) {
              console.log("xx I get %d siteT", _.size(siteT));
              return console.log(JSON.stringify(siteT, void 0, 2));
          }).delay(3000);
    });

