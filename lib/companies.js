var _ = require('lodash'),
    debug = require('debug')('lib.companies');


var associatedCompany = function(companiyMap, domainToCheck) {
    /* companymap is the inverted company map in val.companies */

    var retCompany = null;
    _.each(companiyMap, function(cName, cDomain) {
        if (_.startsWith(domainToCheck, cDomain) || _.endsWith(domainToCheck, cDomain)) {
            return cName;
        }
    });
    return null;
};

module.exports = {
    associatedCompany: associatedCompany
};

