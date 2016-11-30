#!/usr/bin/env nodejs

var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('fixtures');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');

nconf.argv().env().file({ file: 'config/storyteller.json' });

var files = { "byCountry" : "fixtures/data/worldWideRanks.json",
              "population" : "fixtures/data/countriesInfos.json",
              "byCategory" : "fixtures/data/categoriesRanks.json" };

function loadJSONfile(fname) {
    debug("opening %s", fname);
    return fs
        .readFileAsync(fname, "utf-8")
        .then(JSON.parse);
};

function composeList(memo, block) {
    var belong = block.belong;
    _.each(block.retrieved, function(page) {
        if(_.isUndefined(memo[belong]))
            memo[belong] = [];
        memo[belong].push({
            'rank': page.ranked,
            'href': 'http://' + page.name,
            'description': page.description
        });
    });
    return memo;
};

function createCollections(lists) {
    return _.reduce(lists, function(memo, pages, reason) {
        memo.push({
            'pages': pages,
            'name': reason,
            'source': 'First test of invi.sible.link',
            'public': true,
            'id': various.hash({ 'a': reason })
        });
        return memo;
    }, []);
};

function insertLists() {
   
    return Promise.all([
        loadJSONfile(files.byCountry),
        loadJSONfile(files.byCategory)
    ])
    .then(function(contents) {
        var lists = _.reduce(contents[0], composeList, {});
        debug("byCountry produced %d lists", _.size(lists));
        lists = _.reduce(contents[1], composeList, lists);
        debug("+byCategory reach %d lists", _.size(lists));
        return createCollections(lists);
    })
    .then(function(collections) {
        return mongo.writeMany(nconf.get('schema').lists, collections);
    });
};

return insertLists();
