var _ = require('lodash'),
    debug = require('debug')('plugin.reducer');

module.exports = function(staticInput, datainput) {

    var fieldsToKeep = ['href', 'urlSize', 'contentType',
                        'redirect', 'bodySize', 'domain', 'company']
    /* I'm removing host because I don't really need it */

    debug("Reducer plugin, remove Req/Res from the target domain, and debug fields");

    datainput.data = _.reduce(datainput.data, function(memo, sT) {
        if(!(_.size(sT.rr))) {
            debug("Missing R/R from %s", sT.phantomFile);
            return memo;
        }
        /* pick everything beside "rr", is the only one reduced ATM */
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

