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
app.get('/api/v:version/system/info', function(req, res) {
    return dispatchPromise('systemInfo', routes, req, res);
});

app.get('/api/v:version/getRetrieved/:what/:id', function(req, res) {
    return dispatchPromise('getRetrieved', routes, req, res);
});

app.post('/api/v:version/getMass', function(req, res) {
    return dispatchPromise('getMass', routes, req, res);
});

app.get('/api/v:version/getStats', function(req, res) {
    return dispatchPromise('getStats', routes, req, res);
});



var distDir = "/home/oo/Dev/invi.sible.link/dist"
app.get('/favicon.ico', function(req, res) {
    res.sendFile(distDir + '/favicon.ico');
});

app.use('/css', express.static(distDir + '/css'));
app.use('/images', express.static(distDir + '/images'));
app.use('/lib/font/league-gothic', express.static(distDir + '/css'));

app.use('/js/vendor', express.static(distDir + '/js/vendor'));
/* development: the local JS are pick w/out "npm run build" every time */
if(nconf.get('development') === 'true') {
    var scriptPath = '/sections/webscripts';
    console.log(redOn,"ઉ DEVELOPMENT = serving JS from", scriptPath,redOff);
    app.use('/js/local', express.static(distDir + scriptPath));
} else {
    app.use('/js/local', express.static(distDir + '/js/local'));
}

app.get('/:page', function(req, res) {
    return dispatchPromise('getPage', routes, req, res);
});
app.get('/', function(req, res) {
    _.set(req.params, 'page', 'exposer');
    return dispatchPromise('getPage', routes, req, res);
});

