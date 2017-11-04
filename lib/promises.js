var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('lib:promises');
var nconf = require('nconf');

var machetils = require('./machetils');
var mongo = require('./mongo');

function retrieve(daysago, target, type) {

    nconf.env().argv().file({ file: nconf.get('config') });

    var min = moment().startOf('day').toISOString();
    var max = moment().startOf('day').add(1, 'd').toISOString();

    if(daysago) {
        min.subtract(_.parseInt(daysago), 'd');
        max.subtract(_.parseInt(daysago), 'd');
        debug("(%s) DAYSAGO looks between %s and %s", daysago, min, max);
    } else
        debug("Looking for promises between %s and %s", min, max);

    var filter = { "start": { "$gte": new Date( min ), 
                              "$lte": new Date( max ) }};

    if(target)
        filter.campaign = target;
    if(type)
        filter.kind = type;

    return mongo.read(nconf.get('schema').promises, filter);
};

function buildURLs(type, memo, page) {
    /* this is call by bin/analyze* */
    var promiseURLs = _.map(nconf.get('vantages'), function(vp) {
        var url = [ vp.host, 'api', 'v1',
                    page.id, type, 'BP' ].join('/');
        return {
            url: url,
            page: page.href,
            VP: vp.name,
            subjectId: page.id
        }
    });
    return _.concat(memo, promiseURLs);
};

function manageOptions() {

    nconf.file({ file: "config/campaigns.json" });
    debug("Warning: manageOptions overrite temporarly nconf settings");

    var tname = nconf.get('campaign');
    if(!tname) machetils.fatalError("campaign has to be specify via CLI/ENV");
    debug("Looking for campaign %s", tname);

    var found = false;
    _.each(nconf.get('campaigns'), function(cinfo, macroname) {
        if(_.find(cinfo, {name: tname})) {
            debug("Found %s as part of %s", tname, macroname);
            found = tname;
        }
    });
   
    if(!found && _.keys(nconf.get('campaigns')).indexOf(tname) !== -1) {
        debug("You specifiy a macrocampaign name (%s), pick among: %j",
               tname, _.map(nconf.get('campaigns')[tname], 'name') );
        machetils.fatalError("campaign not found");
    }

    if(!found)
        machetils.fatalError("campaign not found");

    return tname;
};

module.exports = {
    retrieve: retrieve,
    buildURLs: buildURLs,
    manageOptions: manageOptions
};
