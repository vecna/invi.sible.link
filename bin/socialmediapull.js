#!/usr/bin/env nodejs
var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var request = Promise.promisifyAll(require('request'));
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('socialmediapull');
var nconf = require('nconf');
var process = require('process');
var moment = require('moment');

var mongo = require('../lib/mongo');
var various = require('../lib/various');
var promises = require('../lib/promises');

nconf.argv().env().file({ file: 'config/vigile.json' });
var type = nconf.get('type');
if(type !== 'basic' && type !== 'badger' ) {
    console.log("Invalid 'type' requested!");
    process.exit(0);
}

function addNewHrefs(input) {

    var direction = {
        href: input.link,
        campaign: "social-media-feed",
        start: moment().startOf('day')
    };

    direction.subjectId = various.hash({
        'target': direction.href,
        'campaign': direction.campaign
    });
    direction.start = new Date(direction.start.format("YYYY-MM-DD"));

    direction.needName = type;
    direction.id = various.hash({
        'href': direction.href,
        'type': direction.needName,
        'start': direction.start,
    });

    return mongo
        .read(nconf.get('schema').promises, { id: direction.id })
        .then(function(exists) {
            if(_.get(exists[0], 'id')  === direction.id)
                return null;

            return direction;
        });
}

remote = nconf.get('remote');

if(_.isUndefined(remote)) {
    debug("You need to specify a variable 'remote' containing the config file");
    process.exit(1);
}

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
