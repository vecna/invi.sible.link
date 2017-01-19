var _ = require('lodash');
var debug = require('debug')('lib:urlutils');

function urlToDomain(url) {
    var retVal = url.replace(/https?:\/\//, '').split('/');
    retVal = _.first(retVal);
    debug("urlToDomain %s →  %s", url, retVal);
    return retVal;
}

function urlClean(url) {
    /* to link to the same subject as best, I want strip the ending /
     *  maybe the parameters too
     *  maybe the /index.*
     */
    if(_.startsWith(url, 'https:')) {
        var secure = true;
    } else {
        var secure = false;
    }
    var uri = url.replace(/https?:\/\//, '');
    uri = uri.replace(/\&.*/, '');
    uri = uri.replace(/\?.*/, '');
    uri = uri.replace(/#.*/, '');
    var chunks = uri.split('/');
    chunks.pop();
    if(secure) {
        var retV = 'https://' + chunks.join("/");
    } else {
        var retV = 'http://' + chunks.join("/");
    }
    debug("urlClean %s →  %s", url, retV);
    debug("%d %d", _.size(url), _.size(retV));
    return retV;
}

function urlToDirectory(url) {

    var rtv = url
        .replace(/\//g, '୵')
        .replace(/:/g, '׃')
        .replace(/\./g, '᎐')
        .replace(/\&/g, 'Ꮬ')
        .replace(/\?/g, 'ᒒ')
    debug("I'm going to call a directory %s", rtv);
    return rtv;
}

module.exports = {
    urlToDomain: urlToDomain,
    urlClean: urlClean,
    urlToDirectory: urlToDirectory,
};

