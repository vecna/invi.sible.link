var express = require('express');
var app = express();
var server = require('http').Server(app);
var _ = require('lodash');
var moment = require('moment');
var bodyParser = require('body-parser');
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var debug = require('debug')('vigile');
var nconf = require('nconf');

var various = require('../lib/various');
var mongo = require('../lib/mongo');
var routes = require('../routes/_vigile');
var dispatchPromise = require('../lib/dispatchPromise');
var defaultSetup = require('../lib/sharedExpress');


var cfgFile = "config/vigile.json";
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

/* see actually how many directive are available when vigile get started */
Promise.resolve(
    mongo
        .readLimit(nconf.get('schema').promises, {
            "start": { "$lt": new Date() },
            "end": { "$gt": new Date() }
        }, {}, 10000, 0)
)
.then(function(promises) {
   if(_.size(promises) === 10000)
       debug("initial check: Promises are more than 1000");
   else
       debug("initial check: Promises are %d", _.size(promises) );
});


/* API specs: dispatchPromise is in /lib/, the argument is in ./routes */

app.get('/api/v:version/getTasks/:vantagePoint/:amount', function(req, res) {
    return dispatchPromise('getTasks', routes, req, res);
});
app.get('/api/v:version/doneTask/:vantagePoint/:id', function(req, res) {
    return dispatchPromise('doneTask', routes, req, res);
});

defaultSetup(app, dispatchPromise, express, routes, 'vigile');
