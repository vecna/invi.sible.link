var _ = require('lodash'),
    debug = require('debug')('plugin.ranks');

module.exports = function(datainput) {

    /* this is an indepotent plugin, dump in the filesystem
      some stuff, and the stuff are used to feed the twitter plugin
      later, do not require .analytics value */

    return datainput;
};

module.exports.argv = {
    'aaaa.aaaa': {
        nargs: 1,
        default: 1,
        desc: 'aaaa'
    }
};
