#!/usr/bin/env nodejs
var express = require('express');
var app = express();
var server = require('http').Server(app);
var Promise = require('bluebird');
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('v2-social-pressure');
var nconf = require('nconf');
var machetils = require('../lib/machetils');

var cfgFile = "config/v2-social-pressure.json";

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
var routes = require('../routes/_v2socialpressure');
var dispatchPromise = require('../lib/dispatchPromise');

/* test, is "port" is not found, then campaign is not found too */
if(!nconf.get('port')) {
    console.error("Probabily the campaign suggested has not the settings file");
    console.error("campaigns/"+ campaign + ".json is required");
    console.error("check in campaigns/README.md the format");
    machetils.fatalError("missing configuration (port)");
}

/* utility, this is the porting of dispatchPromise for the new pattern used in
 * v2-social-pressure */
var webappcnt = {};
function webAppAccess(name, func, routes, req, res) {

    if(_.isUndefined(webappcnt, name))
        webappcnt.name = 1;
    else
        webappcnt.name += 1;

    req.randomUnicode = webappcnt.name;
    debug("%d %s API %s (%s)", req.randomUnicode, moment().format("HH:mm:ss"), name, req.url);

    return new Promise.resolve(func(req))
      .then(function(httpresult) {

          if(_.isObject(httpresult.headers))
              _.each(httpresult.headers, function(value, key) {
                  debug("Setting header %s: %s", key, value);
                  res.setHeader(key, value);
              });

          if(!_.isUndefined(httpresult.json)) {
              debug("%s API %s success・returning JSON (%d bytes)",
                  req.randomUnicode, name,
                  _.size(JSON.stringify(httpresult.json)) );
              res.json(httpresult.json)
          } else if(!_.isUndefined(httpresult.text)) {
              debug("%s API %s success・returning text (size %d)",
                  req.randomUnicode, name, _.size(httpresult.text));
              res.send(httpresult.text)
          } else {
              httpresult.error = "Undetermined failure";
              returnHTTPError(req, res, name, "Undetermined failure");
          }

          /* TODO fix statistics here using webappcnt 
           * is a promise, the actual return value don't matter */
          // return various.accessLog(name, req, httpresult);
      })
      .catch(function(error) {
          debug("%s Trigger an Exception %s: %s",
              req.randomUnicode, name, error);
          return returnHTTPError(req, res, name, "Exception");
      });
};

/* everything begin here, welcome */
server.listen(nconf.get('port'), nconf.get('interface') );
console.log( "http://" + nconf.get('interface') + ':' + nconf.get('port') + " listening");

/* Documented API */

/* Undocumented APIs */

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

app.get('/favicon.ico', function(req, res) {
	res.sendFile(distPath + '/favicon.ico');
});
app.get('/robots.txt', function(req, res) {
    res.sendFile(distPath + '/robots.txt');
});

app.use('/css', express.static(distPath + '/css'));
app.use('/lib', express.static(distPath + '/lib'));
app.use('/fonts', express.static(distPath + '/fonts'));
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

/* the pages configured includes the same index via PUG, every page
 * loads a separated webapp */

var implemented = require('../campaigns/' + campaign + '/pugs/index.js');

app.get('/:page', function(req, res) {
    var fname = _.get(implemented, req.params.page);
    if(!fname) {
        debug("Error, page requested %s not found, fall back on index", req.params.page);
        dispatchPromise('getCampaignIndex', routes, req, res);
    }
    else
        webAppAccess(req.params.page, fname, routes, req, res);
});

/* This rendere the default index */

app.get('/', function(req, res) {
    req.params.page = 'landing';
    dispatchPromise('getCampaignIndex', routes, req, res);
});


