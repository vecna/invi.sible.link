#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('lib:queue');
var nconf = require('nconf');
var process = require('process');
var moment = require('moment');
var path = require('path');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');

nconf.argv().env().file({ file: 'config/vigile.json' });

function buildDirective(testkind, time, url, campaign, description, counter) {

    if(!_.isString(url)) throw new Error("url is not a string!!");

    return {
        kind: testkind,
        start: new Date(moment(time).startOf('day').format("YYYY-MM-DD")),
        id: various.hash({
            'href': url,
            'needName': testkind,
            'campaign': campaign,
            'start': moment(time).startOf('day').format("YYYY-MM-DD")
        }),
        href: url,
        campaign: campaign,
        when: new Date(moment(time).format("YYYY-MM-DD HH:mm")),
        description: description,
        rank: counter,
        subjectId: various.hash({
            'campaign': campaign,
            'start': moment(time).startOf('day').format("YYYY-MM-DD")
        })
    };
}

function csvToDirectives(csvfile, testkinds, campaign) {

    function windowsOrUnix(content) {
        var lines = content.split('\r\n');
        if(_.size(lines) === 1)
            lines = content.split('\n');
        return lines;
    }

    return fs
        .readFileAsync(csvfile, 'utf-8')
        .then(function(csvc) {
            var lines = windowsOrUnix(csvc);
            debug("%d entries in %s", _.size(lines)-1, csvfile);

            return _.reduce(_.tail(lines), function(memo, entry, i) {

                if(_.size(entry) < 10)
                    return memo;

                var site = _.first(entry.split(','));

                if(_.size(site) < 7 ) {
                    debug("file %s, line %d (error)", csvfile, i);
                    return memo;
                }

                var imported = {
                    'href': _.trim(site, '"'),
                    'rank': i + 1,
                    'description': ''
                };

                var desc = _.trim(entry.substr(_.size(site) +1), '"')
                if(_.size(desc > 2))
                    imported.description = d;

                memo.push(imported);
                return memo;
            }, [])
        })
        /* manage the test kinds, duplicare or not.. */
        .map(function(site) {
            return _.map(testkinds, function(t) {
                return _.merge({ type: t}, site);
            });
        })
        .then(_.flatten)
        .map(function(site) {
            return buildDirective(site.type, moment(), site.href, campaign, site.description, site.rank);
        });
}

function add(sequence) {
    return Promise
        .map(sequence, checkIfExists, { concurrency: 1})
        .then(_.compact)
        .then(saveMany)
        .tap(function(x) {
            if(x && x[0])
                debug("added [%s] %d promises ", x[0].campaign, _.size(x));
        });
};

function checkIfExists(obj) {
    return mongo
        .read(nconf.get('schema').promises, { id: obj.id })
        .then(function(exists) {

            if(!exists || !exists[0])
                return obj;

            return (_.get(exists[0], 'id')  === obj.id) ? null : obj;
        });
}

function saveMany(sequence) {
    if(!_.size(sequence)) return [];
    return mongo
        .writeMany(nconf.get('schema').promises, sequence)
        .return(sequence);
};

function report(sequence) {
    if(!_.size(sequence))
        debug("No object reach this point");
    else
        debug("%d object, a random obj is %s",
            _.size(sequence),
            JSON.stringify(_.sample(sequence), undefined, 2));
};

function csvExists(root, fname) {
    var testp = path.join(root, fname);
    return fs.existsSync(testp) ? testp : null;
};

function prepareCampaign(cname, cinfo) {
    /* not exactly the best, but I avoided loop because the same file was appearing twice */
    var paths = [ '../campaigns', './campaigns/', '../' ];
    return _.reduce(cinfo, function(memo, centry) {

        var z = csvExists(paths[0], centry.csv);
        var o = csvExists(paths[1], centry.csv);
        var t = csvExists(paths[2], centry.csv);

        if(z)
            memo.push({ macro: cname, name: centry.name, csv: z });
        else if(o)
            memo.push({ macro: cname, name: centry.name, csv: o });
        else if(t)
            memo.push({ macro: cname, name: centry.name, csv: t });
        else
            debug("Path not found for campaing %s", centry.name);
        return memo;

    }, []);
}

/*
return various
    .loadJSONfile(remote)
    .tap(function(c) {
        if(!c.server || !_.size(c.server)) {
            console.log("The json file as 'remote' do not contains key: server");
            // others key expected: 'url'
            process.exit(1);
        }
    })
    .then(function(c) {
        var url = c.server + c.url;
        return various.loadJSONurl(url);
    })
    .map(addNewHrefs, { concurrency: 1})
    .then(_.flatten)
    .then(_.compact)
    .tap(function(content) {
        if(content && _.size(content))
            debug("The first of %d is %s",
                _.size(content), JSON.stringify(content[0], undefined, 2));
        else
            debug("Empty list: all duplicates?");
    })
    .map(function(doc) {
        return mongo
            .save(nconf.get('schema').promises, doc);
    }, {concurrency: 1});

*/

module.exports = {
    buildDirective: buildDirective,
    csvToDirectives: csvToDirectives,
    add: add,
    checkIfExists: checkIfExists,
    report: report,
    prepareCampaign: prepareCampaign
};
