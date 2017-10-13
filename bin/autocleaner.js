#!/usr/bin/env nodejs
var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var debug = require('debug')('autocleaner');
var nconf = require('nconf');

var mongo = require('../lib/mongo');

var cfgFile = "config/autocleaner.json";
var redOn = "\033[31m";
var redOff = "\033[0m";

nconf.argv()
     .env()
     .file({ file: cfgFile });
console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

return Promise.map(nconf.get('targets'), function(c) {
    /* c has .column .timewindow */
});

