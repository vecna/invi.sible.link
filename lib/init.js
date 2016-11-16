var _ = require('lodash'),
    Promise = require('bluebird'),
    jsonReader = require('./jsonfiles').jsonReader;
    debug = require('debug')('lib.init'),
    moment = require('moment'),
    analytics = require('../lib/analytics'),
    join = require('path').join,
    baseHasher = require('../lib/transformer').baseHasher,
    fs = require('fs');

Promise.promisifyAll(fs);

/* find the appropriate utils lib */
var stripProtocol = function(string) {
    if (_.startsWith(string, 'http://')) {
        return string.substr(7, _.size(string));
    }
    if (_.startsWith(string, 'https://')) {
        return string.substr(8, _.size(string));
    }
    return string;
};

var reduceSource = function(sourceSubject, subjectName, startStatus) {
    /* the format of both By-categories and By-countries is the same, so ... */
    return _.reduce(sourceSubject, function(memo, infoPage) {
        _.each(infoPage.retrieved, function(hrefData) {
            var cleanHref = stripProtocol(hrefData.name);
            if (_.isUndefined(memo[cleanHref])) {
                memo[cleanHref] = {
                    description: hrefData.description
                }
                memo[cleanHref][subjectName] = [];
            }
            if(_.isUndefined(memo[cleanHref][subjectName])) {
                memo[cleanHref][subjectName] = [];
            }
            /* get created .countries and .categories */
            memo[cleanHref][subjectName].push({
                rank: hrefData.ranked,
                where: infoPage.belong
            });
        });
        return memo;
    }, startStatus);
};

var listOfBelongings = function(sourceSubject) {
    /* used to get a list of all the country and categories, handy have list of keys for some _.reduce */
    return _.keys(_.reduce(sourceSubject, function(m, eBc) {
        m[eBc.belong] = true;
        return m;
    }, {}));
}

/* TODO implement a command line option --name that overwrite config.name,
    because this goes saved via lib/history */
var initialize = function(configFile) {

    var staticInput = { world: null, companies: null, config: null, nations: null, lists: {} },
        ranks = { worldRank: null, categories: null };

/* TODO
ho espanso sto codice per gestire errori nel caso di usessero gli ini files,
il giorno della dataviz day non stava funzionando, perchè sto pezzo di codice viene eseguito
indipendentemene dai parametri dei plugin, quindi, va rivisto sta logica di inizializzazione */
    debug("Loading world and companies static informations");
    return jsonReader(configFile)
        .then(function(configContent) {
            staticInput.config = configContent;
            debug("inputs.config contains %d entries", _.size(staticInput.config));
            return staticInput;
        })
        /* load the three keys in 'world' as side-effects */
        .tap(function(staticInput) {
            return jsonReader(staticInput.config.world.countries)
                .then(function(countryInfo) {
                    staticInput.nations = countryInfo;
                });
        })
	.catch(function(error) {
	    debug("Error in reading file: %s", error);
	    staticInput.nations = [];
            return staticInput;
	})
        .tap(function(staticInput) {
            return jsonReader(staticInput.config.world.worldRank)
                .then(function(worldRank) {
                    ranks.worldRank = worldRank;
                    staticInput.lists.countries = listOfBelongings(worldRank);
                });
        })
	.catch(function(error) {
	    debug("Error in reading file: %s", error);
	    ranks.worldRank = [];
	    staticInput.lists.countries = [];
            return staticInput;
	})
        .tap(function(staticInput) {
            return jsonReader(staticInput.config.world.categories)
                .then(function(categories) {
                    ranks.categories = categories;
                    staticInput.lists.categories = listOfBelongings(categories);
                });
        })
	.catch(function(error) {
	    debug("Error in reading file: %s", error);
	    ranks.categories = [];
	    staticInput.lists.categories = [];
            return staticInput;
	})
        /*
        /* then, read the companies, fill them in staticInput  */
        .tap(function(staticInput) {
            return jsonReader(staticInput.config.companies)
                .tap(function(cInfo) {
                    staticInput.companies = _.reduce(cInfo, function(memo, cdomains, cname) {
                        _.each(cdomains, function(domain) {
                            memo[domain] = cname;
                        });
                        return memo;
                    }, {});
                    debug("From %d companies in %s, mapped in %d domains",
                        _.size(cInfo), staticInput.config.companies, _.size(staticInput.companies));
                });
        })
        /* then, we are ready to compose staticInput.world and .lists */
        .then(function() {
            debug("Interpolating %d worldRank entries with %d categories entries",
                _.size(ranks.worldRank), _.size(ranks.categories));

            var byHrefRanks = reduceSource(ranks.categories, 'categories',
                              reduceSource(ranks.worldRank, 'countries', {}) );

            debug("Unique website ranked are %d", _.size(byHrefRanks));

            staticInput.world = _.reduce(byHrefRanks, function(memo, rankInfo, href) {
                var e = _.pick(rankInfo, ['description', 'categories', 'countries']);
                e.href = href;
                e.input_hash = baseHasher(e.href);
                memo.push(e);
                return memo;
            }, []);
            return staticInput;
        })
        /* save the input like the pipeline intermediary output, in a special file */
        .then(function(staticInput) {
            var inputFname = join(staticInput.config.debug, 'staticInput.json');
            debug("    α staticInput saved in %s", inputFname)
            return fs.writeFileAsync(inputFname, JSON.stringify(staticInput, undefined, 2));
        })
        .return(staticInput);
};

/* maybe other function to operate over the files will be implemented:
 write, update, delete, I don't know */
module.exports = {
    initialize: initialize 
};
