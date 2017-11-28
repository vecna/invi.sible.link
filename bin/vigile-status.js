#!/usr/bin/env nodejs
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('vigile-status');
var nconf = require('nconf');

var promises = require('../lib/promises');
var vigilantes = require('../lib/vigilantes');

var cfgFile = "config/vigile.json";

nconf.env().file({ file: cfgFile });

/* see actually how many directive are available when vigile get started */
Promise.resolve(
    promises.retrieve(nconf.get('DAYSAGO'))
)
.then(function(promises) {
    return vigilantes.dump(promises, true);
});
