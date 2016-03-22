var _ = require('lodash'),
    transformer = require('../lib/transformer'),
    debug = require('debug')('plugin.hashish');

module.exports = function(staticInput, datainput) {

    debug("compue hashes, specific and blurred");
    datainput.data = _.map(datainput.data, function(sT) {
        return transformer.specificHash(transformer.blurredHash(sT));
    });
    return datainput;
};

