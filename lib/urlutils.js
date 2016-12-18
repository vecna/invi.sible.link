var _ = require('lodash');
var debug = require('debug')('urlutils');

function urlToDomain(url) {
    var retVal = url
        .replace(/http?:\/\//, '')
        .split('/');
    retVal = _.first(retVal);
    debug("url %s to domain → %s", url, retVal);
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
    if(url.indexOf("#") !== -1) {
        debug("A # in %s", url);
    }
    var uri = url.replace(/^http?:\/\//, '');
    var chunks = uri.split('/');
    chunks.pop();
    if(secure) {
        return 'https://' + chunks.join("/");
    } else {
        return 'http://' + chunks.join("/");
    }
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
    urlToDirectory: urlToDirectory
};

