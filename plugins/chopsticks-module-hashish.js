var _ = require('lodash'),
    transformer = require('../lib/transformer'),
    lookup = require('../lib/lookup'),
    debug = require('debug')('plugin.hashish');

module.exports = function(staticInput, datainput) {
    var units = [],
        source_fields = ['input_hash', 'when'];

    debug("Computing hashes (specific and blurred) and creating units");
    datainput.data = _.map(datainput.data, function(sT) {
        return transformer.specificHash(transformer.blurredHash(sT));
    });

    datainput.source = _.map(datainput.source, function(siteEntry) {
        var newSource = _.pick(siteEntry, source_fields),
            removedData;

        newSource.test_hash = siteEntry._ls_links[0]._ls_id_hash;

        removedData = _.remove(datainput.data, function(sT) {
            return (sT.fetchInfo !== null && 
                    sT.fetchInfo.href_hash === newSource.test_hash);
        })[0];

        if(_.isUndefined(removedData))
            return {};

        newSource.stats = removedData.stats;
        newSource.hashes = _.reduce(removedData.rr, function(memo, rr) {
            /* side effects is to collect them all here, and reference in .source */
            units.push(rr);
            memo.push({
                'blurred': rr._blurred_hash,
                'specific': rr._specific_hash
            });
            return memo;
        }, []);

        return newSource;
    });

    debug("unique Request/Responses units: %d", _.size(units) );
    if ( _.size(datainput.data) !== 0) {
        debug("Still present %d elements ?", _.size(datainput.data));
        console.log(JSON.stringify(datainput.data, undefined, 2));
        throw new Error("Investigate on this!");
    }

    datainput.data = units;
    return datainput;
};

