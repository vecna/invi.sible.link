#!/usr/bin/env nodejs
var express = require('express');
var app = express();
var server = require('http').Server(app);
var _ = require('lodash');
var debug = require('debug')('servente');
var nconf = require('nconf');
var machetils = require('../lib/machetils');

var cfgFile = "config/social-pressure.json";

nconf.argv()
     .env()
     .file('config', cfgFile);

var campaign = nconf.get('campaign');
if(_.isUndefined(campaign) || campaign === "overwritewithenvorcommandline")
    machetils.fatalError("MISSING: campaign environment variable");

var campaignc = 'campaigns/' + campaign + "/config/" + campaign + "-campaign.json";
debug("Loading as campaign config: %s", campaignc);

nconf.argv()
     .env()
     .file('campaign', campaignc)
     .file('config', cfgFile);

/* initialize libraries and inclusion only if the `campaign` variable set */
var routes = require('../routes/_socialpressure');
var dispatchPromise = require('../lib/dispatchPromise');

/* test, is "port" is not found, then campaign is not found too */
if(!nconf.get('port')) {
    console.error("Probabily the campaign suggested has not the settings file");
    console.error("campaigns/"+ campaign + ".json is required");
    console.error("check in campaigns/README.md the format");
    machetils.fatalError("missing configuration (port)");
}

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface') );
console.log( "http://" + nconf.get('interface') + ':' + nconf.get('port') + " listening");

/* API of social pressure */

app.get('/api/v:version/surface/:campaign', function(req, res) {
    return dispatchPromise('getSurface', routes, req, res);
});

app.get('/api/v:version/evidences/:sitename', function(req, res) {
    return dispatchPromise('getEvidencesByName', routes, req, res);
});

app.get('/api/v:version/sankeys/:campaign', function(req, res) {
    return dispatchPromise('getSankeys', routes, req, res);
});

app.get('/api/v:version/csv/:campaign', function(req, res) {
    return dispatchPromise('getCSV', routes, req, res);
});

app.get('/api/v:version/tableau/:cname', function(req, res) {
    return dispatchPromise('getTableauJSON', routes, req, res);
});

/* all tasks */
app.get('/api/v:version/activeTasks', function(req, res) {
    return dispatchPromise('activeTasks', routes, req, res);
});

/* promises by campaign name */
app.get('/api/v:version/tasks/:cname', function(req, res) {
    return dispatchPromise('getCampaignPromises', routes, req, res);
});

app.get('/api/v:version/subjects', function(req, res) {
    return dispatchPromise('getSubjectsStats', routes, req, res);
});

app.get('/api/v:version/stats/:hours', function(req, res) {
    return dispatchPromise('getStats', routes, req, res);
});

/* ----------------------------------------------------- */
var paths = process.env.PWD.split('/');
paths.push('dist');
var distPath = paths.join('/');

app.get('/api/v:version/system/info', function(req, res) {
    return dispatchPromise('systemInfo', routes, req, res);
});

app.get('/favicon.ico', function(req, res) {
	res.sendFile(distPath + '/favicon.ico');
});
app.get('/robots.txt', function(req, res) {
    res.sendFile(distPath + '/robots.txt');
});

app.use('/css', express.static(distPath + '/css'));
app.use('/lib', express.static(distPath + '/lib'));
app.use('/charts', express.static(distPath + '/charts'));
app.use('/images', express.static(distPath + '/images'));

/* development: the local JS are pick w/out "npm run build" every time */
if(nconf.get('development') === 'true') {
	var scriptPath = '/../sections/webscripts';
	console.log("ઉ DEVELOPMENT = serving JS from", distPath + scriptPath);
	app.use('/js/local', express.static(distPath + scriptPath));
} else {
	app.use('/js/local', express.static(distPath + '/js/local'));
}
app.use('/js/vendor', express.static(distPath + '/js/vendor'));
app.use('/campaign', express.static(distPath + '/../campaigns/' + campaign + '/web-accessible'));
app.use('/js', express.static(distPath + '/js/vendor'));

/* setup the three static pages of social-pressure: home, test-archive, single-site */
app.get('/archive/:selector', function(req, res) {
    req.params.page = 'archive';
    dispatchPromise('getCampaignPages', routes, req, res);
});
app.get('/direct/:page', function(req, res) {
    dispatchPromise('getCampaignPages', routes, req, res);
});
app.get('/direct/:sitename/:page', function(req, res) {
    dispatchPromise('getCampaignPages', routes, req, res);
});

app.get('/:sitename/site', function(req, res) {
    req.params.page = 'site';
    dispatchPromise('getCampaignIndex', routes, req, res);
});
app.get('/:page', function(req, res) {
    dispatchPromise('getCampaignIndex', routes, req, res);
});
app.get('/', function(req, res) {
    req.params.page = 'landing';
    dispatchPromise('getCampaignIndex', routes, req, res);
});
