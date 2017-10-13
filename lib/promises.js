var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('promises');
var nconf = require('nconf');

var machetils = require('./machetils');
var mongo = require('./mongo');

function retrieve(daysago, target, type) {

    nconf.env().argv();
    nconf.file({ file: nconf.get('config') });

    var when = moment().startOf('day');

    if(daysago) {
        when.subtract(_.parseInt(daysago), 'd');
        debug("(%s) DAYSAGO moves the begin in: %s", daysago, when);
    }

    var min = when.toISOString();
    var max = when.add(25, 'h').toISOString();

    debug("Looking for promises between %s and %s", min, max);

    var filter = {
        "start": { "$gte": new Date( min ), 
                   "$lt": new Date( max ) },
    };

    /* retrieve is used by 'vigile' with no taskName,
     * and bin/*Campaign with taskName */
    if(target)
        filter.taskName = target;

    if(type)
        filter.needName = type;

    return mongo.read(nconf.get('schema').promises, filter);
};

function buildURLs(type, memo, page) {
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
    nconf.env().argv();
    var cfgFile = nconf.get('config');
    if(!cfgFile) machetils.fatalError("config file has to be specify via CLI/ENV");

    nconf.file({ file: cfgFile });
    nconf.file({ file: "config/campaigns.json" });

    var tname = nconf.get('campaign');
    if(!tname) machetils.fatalError("campaign has to be specify via CLI/ENV");
    debug("Looking for campaign %s", tname);

    if(nconf.get('campaigns').indexOf(tname) === -1) {
        debug("campaign available %j", nconf.get('campaigns'));
        machetils.fatalError("campaign not found");
    }
    return tname;
};

module.exports = {
    retrieve: retrieve,
    buildURLs: buildURLs,
    manageOptions: manageOptions
};
