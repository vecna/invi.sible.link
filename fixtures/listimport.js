#!/usr/bin/env nodejs

var _ = require('lodash');
var Promise = require('bluebird');
var util = require('util');
var fs = Promise.promisifyAll(require('fs'));
var debug = require('debug')('listimport');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
var various = require('../lib/various');

nconf.argv().env().file({ file: 'config/storyteller.json' });

function loadJSONfile(fname) {
    debug("opening %s", fname);
    return fs
        .readFileAsync(fname, "utf-8")
        .then(JSON.parse);
}

function extendPage(page) { 
    /* this extend the basic list content as:
     * {
     *  "name": "darululoom-deoband.com",
     *  "description": "Official site of the Islamic University Darul",
     *  "rank": 50
     * },
     */
    var url = 'http://' + page.name;
    return {
        'rank': page.rank,
        'href': url,
        'domain': page.name,
        'description': page.description,
        'domainId': various.hash({ 'domain': page.name }),
        'id': various.hash({ 'href' : url })
    };
}

var sourcef = nconf.get('source');
var marker = nconf.get('marker');

if(!sourcef || !marker)
    throw new Error("Required `source` and `marker`, source is the file, `marker` is the --source file as option");

return loadJSONfile(sourcef)
    .map(extendPage)
    .then(function(pages) {
        var subject = {};
        subject.name = marker;
        subject.kind = 'list';
        subject.trueOn = new Date("2017-01-28");
        subject.creationTime = new Date();
        subject.subjectId = various.hash(_.pick(subject, [ 'kind', 'name' ]));
        subject.id = various.hash(_.pick(subject, [ 'trueOn', 'kind', 'name' ]));
        subject.pages = pages;
        return subject;
    })
    .then(function(entry) {
        debug("Saving single entry with %d pages", _.size(entry.pages));
        return mongo.writeOne(nconf.get('schema').subjects, entry);
    });
