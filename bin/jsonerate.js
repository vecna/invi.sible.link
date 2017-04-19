#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('anyTREX»jsonerate');
var moment = require('moment');
var nconf = require('nconf').env();

function loadJSONfile(fname) {
    debug("opening file %s", fname);
    return fs
        .readFileAsync(fname, "utf-8")
        .then(JSON.parse)
        .tap(function(check) {
            if(!_.size(check))
                throw new Error("File " + fname + " #" + _.size(check));
        });
};

function loadJSONurl(url) {
    debug("opening url %s", url);
    return request
        .getAsync(url)
        .then(function(res) {
            return res.body;
        })
        .then(JSON.parse);
};

var campaign = nconf.get('campaign');
var sourceJSON = nconf.get('src');
var dstdir = nconf.get('dst');

if(!campaign || !sourceJSON || !dstdir)
    throw new Error("Required `src` - source json, `campaign` name of IVL, `dst`/generated-$.json");

return Promise.all([
    loadJSONfile(sourceJSON),
    loadJSONfile("fixtures/companyCountries.json"),
    loadJSONurl("http://localhost:7000/api/v1/raw/surface/task/" + campaign)
])
.then(function(c) {
    var blockSize = 10;
    if(!_.size(c[1]) || !_.size(c[0]) || !_.size(c[2]) )
        throw new Error("Some source returned 0 data");

    debug("Initial sources read, chunking in blocks of %d", blockSize);
    debugger;
    return Promise.map(_.chunk(c[0], blockSize), function(sitel, i) {

        var nodes = _.reduce(sitel, function(memo, s) {
            var e = _.find(c[2], {'href': s.href });

            if(!e) {
                debug("Lacking of results for %s", s.href);
                return memo;
            }

            if(!_.size(e.companies)) {
                debug("Site %s has not trackers!", s.href);
                return memo;
            }

            memo.push({
                "href": s.href,
                "name": s.href.replace(/https?:\/\//, ''),
                "group": "site",
                "node": _.size(memo)
            });

            _.each(e.companies, function(comp) {
                if(!_.find(memo, {"name": comp, "group": "company" })) {
                    memo.push({
                        "name": comp,
                        "group": "company",
                        "node": _.size(memo)
                    });

                    var nation = c[1][comp];
                    if(!_.isString(nation)) {
                        debug("Warning, company %s lack of nation associated!", comp);
                        debug("https://duckduckgo.com/%s", comp);
                        nation = "00";
                        c[1][comp] = nation;
                    }

                    if(!_.find(memo, {"name": nation, "group": "country"})) {
                        memo.push({
                            "name": nation,
                            "group": "country",
                            "node": _.size(memo)
                        });
                    }
                }
            });
            return memo;

        }, []);

        var companySize = {};
        var links = [];

        _.each(_.filter(nodes, {"group": "site" }), function(sentry) {
            var e = _.find(c[2], {'href': sentry.href });

            _.each(_.uniq(e.companies), function(cname) {
                var t = _.find(nodes, {"group": "company", "name": cname});

                if(!companySize[cname])
                    companySize[cname] = 0;
                companySize[cname] += 1;

                links.push({
                    'source': sentry.node,
                    'target': t.node,
                    'value': 1
                });
            });
        });

        _.each(companySize, function(size, cname) {
            var t = _.find(nodes, {"group": "company", "name": cname});
            var n = _.find(nodes, {"group": "country", "name": c[1][cname] });
            links.push({ 'source': t.node, 'target': n.node, 'value': size });
        });

        debug("File %d: %d nodes, %d links", i, _.size(nodes), _.size(links));
        return { nodes: nodes, links: links };
    })
    .map(function(fcontent, i) {
        i += 1;
        var dfname = dstdir + i + '.json';
        return fs
            .writeFileAsync(dfname, JSON.stringify(fcontent, undefined, 2))
            .tap(function() {
                debug('Saved: %s', dfname);
            });
    });
})
.catch(function(error) {
    debug("Error: %s", error);
});
