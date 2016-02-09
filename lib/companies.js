var _ = require('lodash'),
    debug = require('debug')('lib.companies');


/* currently unused */
var fillCompany = function(invertedCompanies, domainDict) {
    /* invertedCompany contains domain as key, and domainDict contain
       all the unique domain seen, and how many times */

    _.each(siteTested.rr, function(inclusion, ndx) {
        var id = inclusion.domain;
        debug("On %s %d", siteTested.file, ndx);
        _.find(invertedCompanies, function(cname, domain) {
            if (_.startsWith(id, domain)) {
                achivements +=1;
                debug("Found %s in %s (%d)", cname, id, achivements);
                siteTested.rr[ndx].company = cname;
                return true;
            }
        });
    });
    /*
    var companyNumber = _.countBy(_.map(newData, function(sb) {
        return sb.contentType;
    }));
     */
    debug("Done %s with %d match", siteTested.file, achivements);
    siteTested.stats.inclusions = achivements;
    return siteTested;
};

var sharedAnalytics = function() {

};


module.exports = {
    whichCompany: fillCompany,
    sharedAnalytics: sharedAnalytics
};
