var _ = require('lodash');
var debug = require('debug')('route:serveCampaign');
var moment = require('moment');
var Promises = require('bluebird');
var pug = require('pug');
var nconf = require('nconf');

var various = require('../lib/various');
var mongo = require('../lib/mongo');

// NOT TRUE YET: still script inclusion:

/* this is a special route, it return a static page, but
 * the XHR of /judgment API is pre-fetch and kept in 
 * memory. using the dynamic syntax of PUG, the page in
 * sections/compaign.pug 
 *
 * this API also access to config/campaigns.json and 
 * prefetch that content too. Therefore, a reload to the
 * system is necessary.
 * */

function serveCampaign(req) {

    var campaign = req.params.cname;
    var viz = [ "cards", "details", "javascripts" ]
            .indexOf(req.params.viz) >= 0 ? req.params.viz : "cards";
    var filter = { campaign: campaign };

    debug("requested campaign page on %s (%s)", campaign, viz);

    return Promises
        .all([
            mongo
                .readLimit(nconf.get('schema').judgment, filter, { when: -1 }, 1, 0)
                .then(_.first),
            various.loadJSONfile('config/campaigns.json')
        ])
        .then(function(mixed) {

            var judg = mixed[0];
            if(_.isUndefined(judg)) {
                debug("mhh... something looks broken?");
                return {
                    text: pug.compileFile(__dirname + '/../sections/no.pug')()
                };
            }

            var daysago = _.round(
                moment.duration(moment() - moment(judg.when).startOf('day')).asDays());
            debug("Computed from the next API request (until cache don't get implemented, a result of %s, %d daysago", judg.when, daysago);

            var x= _.get(mixed[1].campaigns, campaign);
            if(!x)  {
                debug("Failed in looking for %s in %s",
                    campaign, JSON.stringify(mixed[1].campaigns));
                return {
                    text: pug.compileFile(__dirname + '/../sections/no.pug')()
                };
            }
            var ccfg = _.first(x);

            var cinfo = {
                testedSites: judg.total,
                trackers: judg.trackers,
                notattributed: judg.unrecognized,
                javascripts: judg.includedJS,
                cookies: judg.cookies,
                ogurl: "https://invi.sible.link/campaign/" + campaign + "/" + viz,
                jsonsrc: '/api/v1/judgment/' + campaign + '/' + daysago
            };

            return {
                /* warning: not always true the file will be in campaigns/ 
                 *
                 * maybe can come from ccfg (read from config/campaigns.json ?
                 *
                 * */
                text: pug.compileFile(__dirname + '/../campaigns/'+campaign+'/campaign.pug', {
                    pretty: true
                })(cinfo)
            };
        });
};

module.exports = serveCampaign;
