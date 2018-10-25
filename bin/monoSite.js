#!/usr/bin/env node
var monoSite = require('../lib/monoSite');
var debug = require('debug')('bin:monoSite');
var nconf = require('nconf');

nconf.argv().env().file({ file: 'config/monoSite.json' });

return monoSite.monoSite();
