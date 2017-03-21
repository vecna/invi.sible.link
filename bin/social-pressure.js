#!/usr/bin/env nodejs
var express = require('express');
var app = express();
var server = require('http').Server(app);
var _ = require('lodash');
var debug = require('debug')('servente');
var nconf = require('nconf');

var cfgFile = "config/social-pressure.json";

nconf.argv()
     .env()
     .file({ file: cfgFile });

var campaign = nconf.get('campaign');
if(_.isUndefined(campaign) || campaign === "overwritewithenvorcommandline")
    throw new Error("MISSING: campaign environment variable");

nconf.file({ file: 'campaigns/' + campaign + ".json"});

/* initialize libraries and inclusion only if the `campaign` variable set */
var routes = require('../routes/_socialpressure');
var dispatchPromise = require('../lib/dispatchPromise');

/* test, is "port" is not found, then campaign is not found too */
if(!nconf.get('port')) {
    console.error("Probabily the campaign suggested has not the settings file");
    console.error("campaigns/"+ campaign + ".json is required");
    console.error("check in campaigns/README.md the format");
    throw new Error("missing configuration (port)");
}

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface') );
console.log( nconf.get('interface') + ':' + nconf.get('port') + " listening");

/* API of social pressure */

/* API from storyteller (might be reused) */
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
app.use('/campaign', express.static(distPath + '/../campaigns/' + campaign));
app.use('/js', express.static(distPath + '/js/vendor'));

/* setup the three static pages of social-pressure: home, test-archive, single-site */
app.get('/archive/:selector', function(req, res) {
    req.params.page = 'archive';
    dispatchPromise('getCampaignPages', routes, req, res);
});
app.get('/direct/:page', function(req, res) {
    dispatchPromise('getCampaignPages', routes, req, res);
});
app.get('/:page', function(req, res) {
    dispatchPromise('getCampaignIndex', routes, req, res);
});
app.get('/', function(req, res) {
    req.params.page = 'landing';
    dispatchPromise('getCampaignIndex', routes, req, res);
});

