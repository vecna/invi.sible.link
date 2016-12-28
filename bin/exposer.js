var express = require('express');
var app = express();
var server = require('http').Server(app);
var _ = require('lodash');
var moment = require('moment');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var debug = require('debug')('exposer');
var nconf = require('nconf');

var various = require('../lib/various');
var mongo = require('../lib/mongo');
var routes = require('../routes/_exposer');
var dispatchPromise = require('../lib/dispatchPromise');
var defaultSetup = require('../lib/sharedExpress');

var cfgFile = "config/exposer.json";
var redOn = "\033[31m";
var redOff = "\033[0m";

nconf.argv()
     .env()
     .file({ file: cfgFile });
console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

/* everything begin here, welcome */
server.listen(nconf.get('port'), '127.0.0.1');
console.log("  Port " + nconf.get('port') + " listening");
/* configuration of express4 */
app.use(bodyParser.json({limit: '3mb'}));
app.use(bodyParser.urlencoded({limit: '3mb', extended: true}));


/* API specs: dispatchPromise is in /lib/, the argument is in ./routes */

app.get('/api/v:version/getRetrieved/:what/:id', function(req, res) {
    return dispatchPromise('getRetrieved', routes, req, res);
});

app.post('/api/v:version/getMass', function(req, res) {
    return dispatchPromise('getMass', routes, req, res);
});

app.get('/api/v:version/daily/:what', function(req, res) {
    return dispatchPromise('getStats', routes, req, res);
});


defaultSetup(app, dispatchPromise, express, routes, 'exposer');
