var _ = require('lodash'),
    transformer = require('../lib/transformer'),
    debug = require('debug')('plugin.hashish');

module.exports = function(staticInput, datainput) {

    debug("Reducer plugin, remove Req/Res from the target domain, and debug fields");
    datainput.data = _.map(datainput.data, function(sT) {
        return transformer.specificHash(transformer.blurredHash(sT));
    });

    return datainput;
};

