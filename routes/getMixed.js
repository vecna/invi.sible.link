
var _ = require('lodash');
var debug = require('debug')('route:getMixed');
var moment = require('moment');
var nconf = require('nconf');
var mongo = require('../lib/mongo');
 
function getMixed(req) {

    var daysago = _.parseInt(req.params.daysago) || 0;

    var when = moment().startOf('day').subtract(daysago, 'd');
    var min = when.toISOString();
    var max = when.add(25, 'h').toISOString();

    debug("looking for 'surface' and 'details' %d days ago [%s-%s] campaign %s",
                    daysago, min, max, req.params.cname);

    var filter = {
        "when": { "$gte": new Date( min ), 
                  "$lt": new Date( max ) },
        "campaign": req.params.cname
    };

    return Promise.all([
        mongo.read(nconf.get('schema').surface, filter),
        mongo.read(nconf.get('schema').details, filter)
    ])
    .then(function(mixed) {
        debug("returning %d from surface and %d details",
            _.size(mixed[0]), _.size(mixed[1]));
        return {
            'json': mixed
        }
    });
};

module.exports = getMixed;

