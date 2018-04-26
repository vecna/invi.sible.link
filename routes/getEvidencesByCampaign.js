
var _ = require('lodash');
var debug = require('debug')('route:getEvidencesByCampaign');
var moment = require('moment');
var nconf = require('nconf');
 
var campaignOps = require('../lib/campaignOps');

function getEvidencesByName(req) {

    var filter = { campaign: req.params.cname };
    var past = 24 * 3;

    debug("%s getEvidencesByCampaign filter %j hours %d", req.randomUnicode, filter, past);

    return campaignOps
        .getEvidences(filter, past)
        .then(function(m) {
            debug("getEvidencesByCampaign returns: %d", _.size(m));
            return {
                'json': m
            }
        });
};

module.exports = getEvidencesByCampaign;
