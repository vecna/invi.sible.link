var _ = require('lodash');

function urlToDomain(url) {

}

function urlClean(url) {
    /* to link to the same subject as best, I want strip the ending /
     *  maybe the parameters too
     *  maybe the /index.*
     */
    if(_.startWith(url, 'https:')) {
      var secure = true;
    } else {
      var secure = false;
    }
    var uri = url.replace(/^http?:\/\//, '');
    debugger;
    uri.split('/')
}

var magicMap = {
    '/': 'ഽ',
    ':': '׃',
    '.': '᎐',
    '&': 'Ꮬ',
    '?': 'ᒒ'
}

function urlToDirectory(url) {
    var absurd = null;
    if(_.isString(url)) {
        absurd = magicMap.map(function(v, k) {
            return _.replace(url, k, v);
        });
    }
    debug("I'm going to call a directory %s", absurd);
    return absurd;
}

module.exports = {
    urlToDirectory: urlToDirectory,
    urlToDomain: urlToDomain
};

