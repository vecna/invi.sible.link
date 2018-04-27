
var _ = require('lodash');
var debug = require('debug')('route:getEvidencesByCampaign');
var moment = require('moment');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var urlutils = require('../lib/urlutils');

function getEvidencesByCampaign(req) {

    var daysago = _.parseInt(req.params.daysago) || 1;
    var filter = { 
	campaign: req.params.cname,
        when: {
		'$gte':
		    new Date(
                            moment()
                                .subtract(daysago, 'd')
                                .toISOString() 
                    ) 
	}
    };

    debug("getEvidencesByCampaign %s last three days", req.params.cname);

    return mongo
	.read(nconf.get('schema').evidences, filter)
        .map(function(e) {
            var c = _.replace(e['Content-Type'], /;.*/, '');
            e['Content-Type'] = c;
            var r = _.omit(e, ['domain', 'domaindottld', 'tld',
                               'urlId', 'domainId', 'relationId',
                               'subjectId', 'companyC', 'subdomain',
                               'ETag', '_id' ]);
            r.version = 3;
            r.domain = urlutils.urlToDomain(r.url);
            if(r.domain.match('.google'))
                r.company = 'Google';
            return r;
        })
        .then(function(m) {
            debug("getEvidencesByCampaign returns: %d", _.size(m));
            return {
                'json': m
            }
        });
};

module.exports = getEvidencesByCampaign;
