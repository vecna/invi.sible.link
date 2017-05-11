var debug = require('debug')('route:getSankeys');
var nconf = require('nconf');

var mongo = require('../lib/mongo');
 
function getSankeys(req) {

    var filter = { campaign: req.params.campaign };

    debug("%s getSankeys filter %j", req.randomUnicode, filter);

    return mongo
        .readLimit(nconf.get('schema').sankeys, filter, { when: 1 }, 0, 1) 
        .then(function(sankey) {
            return {
                'json': sankey
            }
        });
};

module.exports = getSankeys;
