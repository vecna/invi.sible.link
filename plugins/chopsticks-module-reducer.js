var _ = require('lodash'),
    debug = require('debug')('plugin.reducer');

/* this module has to be/can be called after analysis, simply strip
 * the Request/Response without a company associated, out of datainput.data.rr */ 

module.exports = function(datainput) {

    if ( _.size(datainput.analytics) === 0 ) {
        throw new Error("operation 'reducer' is intended to be launched after datainput.analytics is computed");
    }

    debug("reducer plugin iterating over datainput.data.rr, and remove everything not associated to a company");
    datainput.data = _.reduce(datainput.data, function(memo, sT) {
      /* pick everything beside "rr" */
        var newSiteTest = _.pick(sT, 'stats', 'phantomFile', 'fetchInfo');
        newSiteTest.rr = _.reduce(sT.rr, function(m, httpRR) {
            if(httpRR.company !== null) {
                m.push(httpRR);
            }
            return m;
        }, []);
        memo.push(newSiteTest);
        return memo;
    }, []);
    return datainput;
};

