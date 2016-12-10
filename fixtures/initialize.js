#!/usr/bin/env nodejs

var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('fixtures');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var stripper = require('../lib/stripper');

nconf.argv().env().file({ file: 'config/storyteller.json' });

var files = { "byCountry" : "fixtures/data/worldWideRanks.json",
              "population" : "fixtures/data/countriesInfos.json",
              "byCategory" : "fixtures/data/categoriesRanks.json",
              "companies": "fixtures/data/companyreference.json"
};

function loadJSONfile(fname) {
    debug("opening %s", fname);
    return fs
        .readFileAsync(fname, "utf-8")
        .then(JSON.parse);
}

function composeList(memo, block) {
    var belong = block.belong;
    _.each(block.retrieved, function(page) {
        if(_.isUndefined(memo[belong]))
            memo[belong] = [];
        var url = 'http://' + page.name;
        memo[belong].push({
            'rank': page.ranked,
            'href': url,
            'domain': page.name,
            'description': page.description,
            'domainId': various.hash({ 'domain': page.name }),
            'id': various.hash({ 'href' : url })
        });
    });
    return memo;
}

function createCollections(lists, worldPopulation) {

    return _.reduce(lists, function(memo, pages, reason) {
        var subject = {
            'pages': pages,
            'source': 'Initialization subjects for invi.sible.link',
            'public': true
        };
        if(_.size(reason) == 2) {
            var cdesc = _.find(worldPopulation, { twolc: reason });
            subject.name = cdesc.country;
            subject.kind = 'country';
            subject.iso3166 = reason;
            subject.population = _.parseInt(cdesc.ppl);
        } else {
            subject.name = reason;
            subject.kind = 'category';
        }
        subject.creationTime = new Date();
        subject.trueOn = new Date("2016-03-17");
        subject.subjectId = various.hash(_.pick(subject, ['kind', 'name']));
        subject.id = various.hash(_.pick(subject,['trueOn','kind','name']));
        memo.push(subject);
        return memo;
    }, []);
}

function insertLists() {
   
    return Promise.all([
        loadJSONfile(files.byCountry),
        loadJSONfile(files.byCategory),
        loadJSONfile(files.population)
    ])
    .then(function(contents) {
        var lists = _.reduce(contents[0], composeList, {});
        debug("byCountry produced %d lists", _.size(lists));
        lists = _.reduce(contents[1], composeList, lists);
        debug("+byCategory reach %d lists", _.size(lists));
        return createCollections(lists, contents[2]);
    })
    .then(function(collections) {
        return loadJSONfile(files.companies)
            .then(function(reflist) {
                return _.map(collections, function(subject) {
                    subject.pages = stripper.strip3dpartyFromList(subject.pages, reflist);
                    debug("Subject %s reduced to %d sites after 3rd party strip",
                        subject.name, _.size(subject.pages));
                    return subject;
                });
            });
    })
    .then(function(collections) {
        return mongo.writeMany(nconf.get('schema').subjects, collections);
    });
}

return insertLists();
