
var _ = require('lodash');
var nconf = require('nconf');
var debug = require('debug')('lib:sharedExpress');
var Promise = require('bluebird');
var various = require('./various');

function minuteFlush() {
    if(_.size(various.accessLogBuffer)) {
        debug("Minute callback has found accessLog in queue (%d)",
            _.size(various.accessLogBuffer));
        return various.accessLogFlush();
    }
};

function defaultSetup(app, dispatchPromise, express, routes, defaultIndex)  {

    var distPath;
    try {
        var paths = process.env.PWD.split('/');
        paths.push('dist');
        distPath = paths.join('/') + '/';
    } catch (erro) {
        /* exactly, this is windows support! */
        distPath = '.\\dist\\';
    }

    app.get('/api/v:version/system/info', function(req, res) {
        return dispatchPromise('systemInfo', routes, req, res);
    });

    app.get('/favicon.ico', function(req, res) {
        res.sendFile(distPath + 'favicon.ico');
    });

    app.use('/css', express.static(distPath + 'css'));
    app.use('/lib', express.static(distPath + 'lib'));
    app.use('/charts', express.static(distPath + 'charts'));
    app.use('/images', express.static(distPath + 'images'));

    /* development: the local JS are pick w/out "npm run build" every time */
    if(nconf.get('development') === 'true') {
        var scriptPath = '../sections/webscripts';
        console.log("ઉ DEVELOPMENT = serving JS from", distPath + scriptPath);
        app.use('/js/local', express.static(distPath + scriptPath));
    } else {
        app.use('/js/local', express.static(distPath + 'js/local'));
    }
    app.use('/js/vendor', express.static(distPath + 'js/vendor'));
    app.use('/js', express.static(distPath + 'js/vendor'));

    app.get('/:page/:ignored_p', function(req, res) {
        debug("parameter %s ignored server side", req.params.ignored_p);
        return dispatchPromise('getPage', routes, req, res);
    });
    app.get('/:page', function(req, res) {
        return dispatchPromise('getPage', routes, req, res);
    });
    app.get('/', function(req, res) {
        _.set(req.params, 'page', defaultIndex);
        return dispatchPromise('getPage', routes, req, res);
    });

    setInterval(minuteFlush, 60 * 1000);
}

module.exports = defaultSetup;

