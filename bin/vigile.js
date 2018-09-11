#!/usr/bin/env node
var express = require('express');
var app = express();
var server = require('http').Server(app);
var _ = require('lodash');
var moment = require('moment');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var debug = require('debug')('vigile');
var nconf = require('nconf');

var various = require('../lib/various');
var mongo = require('../lib/mongo');
var promises = require('../lib/promises');

var routes = require('../routes/_vigile');
var dispatchPromise = require('../lib/dispatchPromise');
var vigilantes = require('../lib/vigilantes');
var defaultSetup = require('../lib/sharedExpress');

var cfgFile = "config/vigile.json";
var redOn = "\033[31m";
var redOff = "\033[0m";

nconf.argv().env().file({ file: cfgFile });
console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface') );
console.log( nconf.get('interface') + ':' + nconf.get('port') + " listening");
/* configuration of express4 */
app.use(bodyParser.json({limit: '3mb'}));
app.use(bodyParser.urlencoded({limit: '3mb', extended: true}));

/* see actually how many directive are available when vigile get started */
Promise.resolve(
    promises.retrieve(nconf.get('DAYSAGO'))
)
.then(function(promises) {
    return vigilantes.dump(promises, false);
});

app.get('/api/v:version/queueCampaigns', function(req, res) {
    return dispatchPromise('queueCampaigns', routes, req, res);
});
app.get('/api/v:version/getTasks/:vantagePoint/:type/:amount', function(req, res) {
    return dispatchPromise('getTasks', routes, req, res);
});
app.get('/api/v:version/getMandatory/:vantagePoint/:type/:amount', function(req, res) {
    return dispatchPromise('getMandatoryTasks', routes, req, res);
});
app.get('/api/v:version/doneTask/:vantagePoint/:type/:id', function(req, res) {
    return dispatchPromise('doneTask', routes, req, res);
});

defaultSetup(app, dispatchPromise, express, routes, 'vigile');
