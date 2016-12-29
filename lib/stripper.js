var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('lib:stripper');

function strip3dpartyFromList(pageColl, trackersL) {
    /* this module strip off from the top websites collected, the tracking
     * companies, for example: G.F. & Twitter */
    var tl = _.flatten(_.values(trackersL));
    return _.reduce(pageColl, function(memo, siteEntry) {
        if(tl.indexOf(siteEntry.domain) === -1)
            memo.push(siteEntry);

        return memo;
    }, []);
}

module.exports = {
    strip3dpartyFromList: strip3dpartyFromList
};
