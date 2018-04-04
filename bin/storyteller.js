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

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/* Special API: take everything requested: column, key, value */
app.get('/api/v:version/raw/:column/:key/:value', function(req, res) {
    return dispatchPromise('getRaw', routes, req, res);
});

/* API specs: dispatchPromise is in /lib/, the argument is in ./routes */
app.get('/api/v:version/surface/:campaign', function(req, res) {
    return dispatchPromise('getSurface', routes, req, res);
});

app.get('/api/v:version/extended/:campaign', function(req, res) {
    return dispatchPromise('getEvidencesExtended', routes, req, res);
});

app.get('/api/v:version/csv/:campaign', function(req, res) {
    return dispatchPromise('getCSV', routes, req, res);
});

app.get('/api/v:version/activeTasks', function(req, res) {
    return dispatchPromise('activeTasks', routes, req, res);
});

app.get('/api/v:version/recent', function(req, res) {
    return dispatchPromise('getRecentActivities', routes, req, res);
});

app.get('/api/v:version/campaign/:cname', function(req, res) {
    return dispatchPromise('getCampaignSubject', routes, req, res);
});

app.get('/api/v:version/history/:href', function(req, res) {
    return dispatchPromise('getEvidencesByHref', routes, req, res);
});

app.get('/api/v:version/campaignNames', function(req, res) {
    return dispatchPromise('getCampaignNames', routes, req, res);
});

app.get('/api/v:version/tableau/:cname', function(req, res) {
    return dispatchPromise('getTableauJSON', routes, req, res);
});

app.get('/api/v:version/subjects', function(req, res) {
    return dispatchPromise('getSubjectsStats', routes, req, res);
});

app.get('/api/v:version/stats/:hours', function(req, res) {
    return dispatchPromise('getStats', routes, req, res);
});

app.get('/api/v:version/summary/:cname', function(req, res) {
    return dispatchPromise('getSummary', routes, req, res);
});

app.get('/api/v:version/details/:cname', function(req, res) {
    return dispatchPromise('getDetails', routes, req, res);
});

app.get('/api/v:version/url/:check', function(req, res) {
    return dispatchPromise('getCheckURL', routes, req, res);
});

app.get('/api/v:version/mixed/:cname/:daysago?', function(req, res) {
    return dispatchPromise('getMixed', routes, req, res);
});

app.get('/api/v:version/judgment/:cname/:daysago?', function(req, res) {
    return dispatchPromise('getJudgment', routes, req, res);
});

app.get('/api/v:version/siteinfo/:subjectId', function(req, res) {
    return dispatchPromise('getSiteInfo', routes, req, res);
});

app.get('/campaign/:cname/:viz?', function(req, res) {
    return dispatchPromise('serveCampaign', routes, req, res);
});

app.get('/site/:hreforid', function(req, res) {
    req.params.pug = 'site.pug';
    return dispatchPromise('serveSite', routes, req, res);
});

app.get('/verbose/:hreforid', function(req, res) {
    req.params.pug = 'verbose.pug';
    return dispatchPromise('serveSite', routes, req, res);
});

defaultSetup(app, dispatchPromise, express, routes, 'storyteller');
