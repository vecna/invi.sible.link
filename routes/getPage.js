var _ = require('lodash');
var debug = require('debug')('route:getPages');
var pug = require('pug');

var pugCompiler = function(filePrefix) {
    return pug.compileFile(
        __dirname + '/../sections/' + filePrefix + '.pug', {
            pretty: true,
            debug: false
        }
    );
};

var pageMap = {
    'storyteller': pugCompiler('storyteller'),
    'vigile': pugCompiler('vigile'),
    'graphs': pugCompiler('exposergraph'),
    'raw': pugCompiler('raw'),
    'exposer': pugCompiler('exposer'),
    'subjects': pugCompiler('subjects'),
    'last': pugCompiler('last'),
    'stats': pugCompiler('stats'),
    'project-plan': pugCompiler('projectPlan'),
    'about': pugCompiler('about'),
    'report': pugCompiler('reportList'),
    '404': pugCompiler('404')
};

var getPage = function(req) {

    var pageName = _.get(req.params, 'page');

    if(_.isUndefined(_.get(pageMap, pageName))) {
        debug("%s getPage on %s: not found", req.randomUnicode, pageName);
        pageName = '404';
    } else {
        debug("%s getPage of %s", req.randomUnicode, pageName);
    }

    return { 'text': pageMap[pageName]() };
};

module.exports = getPage;
