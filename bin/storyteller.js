var express = require('express');
var app = express();
var server = require('http').Server(app);
var _ = require('lodash');
var moment = require('moment');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var debug = require('debug')('storyteller');
var nconf = require('nconf');

var various = require('../lib/various');
var routes = require('../routes/_storyteller');
var dispatchPromise = require('../lib/dispatchPromise');
var defaultSetup = require('../lib/sharedExpress');

var cfgFile = "config/storyteller.json";
var redOn = "\033[31m";
var redOff = "\033[0m";

nconf.argv()
     .env()
     .file({ file: cfgFile });
console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface') );
console.log( nconf.get('interface') + ':' + nconf.get('port') + " listening");
/* configuration of express4 */
app.use(bodyParser.json({limit: '3mb'}));
app.use(bodyParser.urlencoded({limit: '3mb', extended: true}));

/* Special API: take everything requested: column, key, value */
app.get('/api/v:version/raw/:column/:key/:value', function(req, res) {
    return dispatchPromise('getRaw', routes, req, res);
});

/* API specs: dispatchPromise is in /lib/, the argument is in ./routes */

app.get('/api/v:version/mostUniqueTrackers/:task', function(req, res) {
    return dispatchPromise('getRanked', routes, req, res);
});

app.get('/api/v:version/byCompanies/:task', function(req, res) {
    return dispatchPromise('getCompanies', routes, req, res);
});

app.get('/api/v:version/surface/:task', function(req, res) {
    return dispatchPromise('getSurface', routes, req, res);
});

app.get('/api/v:version/activeTasks', function(req, res) {
    return dispatchPromise('activeTasks', routes, req, res);
});

app.get('/api/v:version/campaign/:cc', function(req, res) {
    return dispatchPromise('getCampaignSubject', routes, req, res);
});

app.get('/api/v:version/subjects', function(req, res) {
    return dispatchPromise('getSubjects', routes, req, res);
});

app.get('/api/v:version/stats/:hours', function(req, res) {
    return dispatchPromise('getStats', routes, req, res);
});

defaultSetup(app, dispatchPromise, express, routes, 'storyteller');
