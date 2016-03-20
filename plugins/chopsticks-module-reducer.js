var _ = require('lodash'),
    debug = require('debug')('plugin.reducer');

module.exports = function(staticInput, datainput) {

    var fieldsToKeep = ['href', 'urlSize', 'contentType',
                        'redirect', 'bodySize', 'domain', 'company']
    /* I'm removing host because I don't really need it */

    if ( _.size(datainput.analytics) === 0 )
        throw new Error("operation 'reducer' is intended to be launched after 'analysis' plugin");

    debug("Reducer plugin, remove Req/Res from the target domain, and debug fields");

    datainput.data = _.reduce(datainput.data, function(memo, sT) {
        /* pick everything beside "rr" */
        var reducedSiteRR = _.pick(sT, 'stats', 'phantomFile', 'fetchInfo');
            targetDomain = sT.rr[0].domain;

        reducedSiteRR.rr = _.reduce(sT.rr, function(m, httpRR) {
            if(httpRR.domain !== targetDomain)
                m.push(_.pick(httpRR, fieldsToKeep));
            return m;
        }, []);
        memo.push(reducedSiteRR);
        return memo;
    }, []);

    return datainput;
};

