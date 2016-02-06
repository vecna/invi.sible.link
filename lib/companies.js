var _ = require('lodash'),
    debug = require('debug')('lib.companies');


var fillCompany = function(invertedCompanies, domainDict) {

    /* now just don't care about optimization! after you'll sort company
        keeping order as the much used one, so it is statistically blah. */

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

module.exports = {
    whichCompany: fillCompany
};
