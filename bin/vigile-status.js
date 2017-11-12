#!/usr/bin/env nodejs
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('vigile-status');
var nconf = require('nconf');

var promises = require('../lib/promises');

var cfgFile = "config/vigile.json";

nconf.env().file({ file: cfgFile });

/* see actually how many directive are available when vigile get started */
Promise.resolve(
    promises.retrieve(nconf.get('DAYSAGO'))
)
.then(function(promises) {
    _.each(['badger', 'basic'], function(c) {
        var f = _.filter(promises, {kind: c});
        var x = _.map(f, function(p) {
            return { 'keys': _.size(_.keys(p)) - 9 };
        });
        debug("Type %s, %d Promises, status: %s",
            c, _.size(f),
            JSON.stringify(_.countBy(x, 'keys'), undefined, 2)
        );
    });
});
