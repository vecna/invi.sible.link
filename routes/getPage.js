var _ = require('lodash');
var debug = require('debug')('getPages');
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
  '/': pugCompiler('homepage'),
  'lists': pugCompiler('lists'),
  '404': pugCompiler('404')
};

var getPage = function(req) {

    var pageName = _.get(req.params, 'page', '/');

    if(_.isUndefined(_.get(pageMap, pageName))) {
        debug("%s getPage on %s: not found", req.randomUnicode, pageName);
        pageName = '404';
    } else {
        debug("%s getPage of %s", req.randomUnicode, pageName);
    }

    return { 'text': pageMap[pageName]() };
};

module.exports = getPage;
