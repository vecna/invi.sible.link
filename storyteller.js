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
var various = require('./lib/various');
var routes = require('./routes/storyteller');

var cfgFile = "config/storyteller.json";
var redOn = "\033[31m";
var redOff = "\033[0m";

nconf.argv()
     .env()
     .file({ file: cfgFile });
console.log(redOn + "ઉ nconf loaded, using " + cfgFile + redOff);

var wrapError = function(where, v, fn, nfo) {
    var str = redOn + " " + where + " Developer mistake v(" +
              v + ") " + fn + "\n" +
              JSON.stringify(nfo, undefined, 2) + redOff;
    console.log(str);
};

/* This function wraps all the API call, checking the verionNumber
 * managing error in 4XX/5XX messages and making all these asyncronous
 * I/O with DB, inside this Bluebird */
var dispatchPromise = function(name, req, res, next) {

    var apiV = _.parseInt(_.get(req.params, 'version'));

    /* force version to the only supported version */
    if(_.isNaN(apiV) || (apiV).constructor !== Number || apiV != 1)
        apiV = 1;

    if(_.isUndefined(req.randomUnicode))
        req.randomUnicode = String.fromCharCode(_.random(0x0391, 0x085e));

    debug("%s %s API v%d name %s (%s)", req.randomUnicode,
        moment().format("HH:mm:ss"), apiV, name, req.url);

    var func = _.get(escviAPI.implementations, name, null);

    if(_.isNull(func)) {
        debug("%s Wrong function name requested: %s",
            req.randomUnicode, name);
        wrapError("pre-exec", apiV, funcName, req.params, res);
        res.status(500);
        res.send('error');
        return false;
    }

    return new Promise.resolve(func(req))
      .then(function(httpresult) {
          if(!_.isUndefined(httpresult.json)) {
              debug("%s API %s success・returning JSON (%d bytes)",
                  req.randomUnicode, name,
                  _.size(JSON.stringify(httpresult.json)) );
              res.json(httpresult.json)
          } else if(!_.isUndefined(httpresult.text)) {
              debug("%s API %s success・returning text (size %d)",
                  req.randomUnicode, name, _.size(httpresult.text));
              res.send(httpresult.text)
          } else if(!_.isUndefined(httpresult.file)) {
              /* this is used for special files, beside the css/js below */
              debug("%s API %s success・returning file (%s)",
                  req.randomUnicode, name, httpresult.file);
              res.sendFile(__dirname + "/html/" + httpresult.file);
          } else {
              debug("%s default failure", req.randomUnicode);
              res.header(500);
          }

          return various.accessLog(name, req, httpresult);
      });
};

/* everything begin here, welcome */
server.listen(nconf.get('port'));
console.log("  Port " + nconf.get('port') + " listening");
/* configuration of express4 */
app.use(bodyParser.json({limit: '3mb'}));
app.use(bodyParser.urlencoded({limit: '3mb', extended: true}));

/* generic info */
app.get('/api/v:version/system/info', function(req, res) {
    return dispatchPromise('systemInfo', req, res);
});

app.get('/api/v:version/lists', function(req, res) {
    return dispatchPromise('getLists', req, res);
});

app.get('/report', function(req, res) {
    return dispatchPromise('getReport', req, res);
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
    console.log(redOn + "ઉ DEVELOPMENT = serving JS from src" + redOff);
    app.use('/js/local', express.static(__dirname + '/sections/webscripts'));
} else {
    app.use('/js/local', express.static(__dirname + '/dist/js/local'));
}

/* catch all and homepage as final default catcher */
app.get('/:page', function(req, res) {
    return dispatchPromise('getPage', req, res);
});
app.get('/', function(req, res) {
    return dispatchPromise('getPage', req, res);
});


