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

/* routes contiene gli handler dell'app, various le util generiche,
 * mentre tutte le utils d'alto livello sono implementate in utils
 * con un nome caratteristico per la funzionalità d'alto livello, che
 * prende sempre come argomento un oggetto o una collection e ci lavora
 * facendo tornare un nuovo valore */
var various = require('../lib/various');
var routes = require('../routes/_storyteller');
var dispatchPromise = require('../lib/dispatchPromise');

var cfgFile = "config/storyteller.json";
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

app.get('/api/v:version/subjects', function(req, res) {
    return dispatchPromise('getSubjects', routes, req, res);
});

app.get('/favicon.ico', function(req, res) {
    res.sendFile(__dirname + '/dist/favicon.ico');
});

app.use('/css', express.static(__dirname + '/dist/css'));
app.use('/images', express.static(__dirname + '/dist/images'));
app.use('/lib/font/league-gothic', express.static(__dirname + '/dist/css'));

app.use('/js/vendor', express.static(__dirname + '/dist/js/vendor'));
/* development: the local JS are pick w/out "npm run build" every time */
if(nconf.get('development') === 'true') {
    var scriptPath = '/sections/webscripts';
    console.log(redOn,"ઉ DEVELOPMENT = serving JS from", scriptPath,redOff);
    app.use('/js/local', express.static(__dirname + scriptPath));
} else {
    app.use('/js/local', express.static(__dirname + '/dist/js/local'));
}

/* catch all and homepage as final default catcher */
app.get('/:page', function(req, res) {
    return dispatchPromise('getPage', routes, req, res);
});
app.get('/', function(req, res) {
    _.set(req.params, 'page', 'storyteller');
    return dispatchPromise('getPage', routes, req, res);
});
