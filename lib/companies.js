var _ = require('lodash'),
    debug = require('debug')('lib.companies');


var associatedCompany = function(companiyMap, domainToCheck) {
    /* companymap is the inverted company map in val.companies */
    if (_.isUndefined(domainToCheck)) {
      throw new Error("Invalid usage of 'associatedCompany'");
    }
    var retCname = null;
    _.each(companiyMap, function(cName, cDomain) {
        if (_.startsWith(domainToCheck, cDomain) || _.endsWith(domainToCheck, cDomain)) {
            retCname = cName;
        }
    });
    return retCname;
};

module.exports = {
    associatedCompany: associatedCompany
};

