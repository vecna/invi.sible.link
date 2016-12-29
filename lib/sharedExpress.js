
var _ = require('lodash');
var nconf = require('nconf');

function defaultSetup(app, dispatchPromise, express, routes, defaultIndex)  {

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
    app.use('/images', express.static(distPath + '/images'));
    app.use('/lib/font/league-gothic', express.static(distPath + '/css'));

    /* development: the local JS are pick w/out "npm run build" every time */
    if(nconf.get('development') === 'true') {
        var scriptPath = '/../sections/webscripts';
        console.log("ઉ DEVELOPMENT = serving JS from", distPath + scriptPath);
        app.use('/js/local', express.static(distPath + scriptPath));
    } else {
        app.use('/js/local', express.static(distPath + '/js/local'));
    }
    app.use('/js', express.static(distPath + '/js/vendor'));

    app.get('/:page', function(req, res) {
        return dispatchPromise('getPage', routes, req, res);
    });
    app.get('/', function(req, res) {
        _.set(req.params, 'page', defaultIndex);
        return dispatchPromise('getPage', routes, req, res);
    });
}

module.exports = defaultSetup;

