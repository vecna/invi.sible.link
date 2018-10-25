var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('bin:monoSite');
var nconf = require('nconf');
var moment = require('moment');
var path = require('path');

var spawnCommand = require('../lib/cmdspawn');
var urlutils = require('../lib/urlutils');
var phantomOps = require('../lib/phantomOps');
var company = require('../lib/company');
var google = require('../lib/google');
var mongo = require('../lib/mongo');

function phantomJS(directive) {
    debug("Executing phantomJS (path) %s (max seconds) %d", directive.incompath, nconf.get('maxSeconds'));
    return spawnCommand({
        binary: 'node_modules/.bin/phantomjs',
        args: [ "--config=fixtures/phantomcfg/phantomcfg.json",
                "fixtures/phantomcfg/phjsrender.js",
                directive.page,
                directive.incompath,
                nconf.get('maxSeconds') ]
    })
    .then(function() {
        return phantomOps
            .readReport(directive.incompath + '.json')
            .then(function(content) {
                directive.data = _.values(content);
                debug("%d inclusions observed", _.size(directive.data));
                return directive;
            });
    });
};

function aggregateInclusions(directive) {

    directive.summary = _.reduce(directive.data, function(memo, inclusion) {

        if(inclusion['Content-Type'] && inclusion['Content-Type'].match('script'))
            memo.javascripts += 1;

        if(inclusion.company && memo.companies.indexOf(inclusion.company) === -1 )
            memo.companies.push(inclusion.company);

        if(inclusion.cookies && _.size(inclusion.cookies))
            memo.cookies.push(inclusion.domaindottld);

        if(inclusion.product) {
            if(_.get(memo.googles, inclusion.product))
                memo.googles[inclusion.product]++;
            else
                _.set(memo.googles, inclusion.product, 1);
        }

        return memo;
    }, {
        javascripts: 0,
        cookies: [],
        companies: [],
        googles: {}
    });
    return directive;
};

function main() {

    var url = nconf.get('url');
    var campaign = nconf.get('campaign') || "manuallyInserted";

    if(!url)
        return console.log("--url required");

    debug("(url) %s (campaign) %s", url, campaign);

    var directive = {
        when: new Date(),
        page: url,
        incompath: path.join(nconf.get('root'), moment().format("MMM-DD-HH"), urlutils.urlToDirectory(url) )
    };

    debug("(path) %s", directive.incompath);

    return phantomJS(directive)
        .then(function(directive) {
            return google.valorizeGoogle(
                    company.countries(
                        company.attribution(directive)
                    )
                );
        })
        .then(aggregateInclusions)
        .tap(function(directive) {
            debug("Analysis completed for %s");
            debug("%s", JSON.stringify(directive.summary, undefined, 2));

            return mongo
                .writeOne(nconf.get('schema').monosite, directive);
        });
}

module.exports = { monoSite: main };

