var _ = require('lodash');
var debug = require('debug')('route:serveSite');
var moment = require('moment');
var Promises = require('bluebird');
var pug = require('pug');
var nconf = require('nconf');

var various = require('../lib/various');
var mongo = require('../lib/mongo');
var siteinfo = require('../lib/siteinfo');
var getSiteInfo = require('./getSiteInfo');

/* This function is similar to serveCampaign, but has also a secondary
 * effect of being dumped in .png file and compose the open graph 
 * picture used by this page itself */

function serveSite(req) {

    /* this API can get as request a subjectId of any site bad enough to 
     * go in judgment */

    var queid = /^[a-fA-F0-9]+$/.exec(req.params.hreforid);
    if(!(queid && _.size(queid[0]) === 40))
        throw new Error("Wrong input, expected something looking like a sha256 output");

    return siteinfo
        .getJudgmentAndDetails(queid[0])
        .then(function(v) {

            if(_.isUndefined(v.surface)) {
                debug("mhh... it looks broken?");
                return {
                    text: pug.compileFile(__dirname + '/../sections/no.pug')()
                };
            }

            var daysago = _.round( moment
                .duration(moment() - moment(v.surface.when)
                .startOf('day'))
                .asDays()
            );

            debug("The test returned is %d days old", daysago);

            var fields = ['href', 'javascripts', 'subjectId', 'leaders', 'campaign' ];
            var pageinfo = _.pick(v.surface, fields);
            debug("Warning: hardcoded server name invi.sible.link, this can't run elsewhere");
            _.extend(pageinfo, {
                trackers: _.size(v.surface.companies),
                notattributed: _.size(v.surface.unrecognized),
                cookies: _.size(v.surface.cookies),
                ogurl: "https://invi.sible.link/site/" + v.surface.subjectId
            });

            // console.log(JSON.stringify(pageinfo, undefined, 2));

            return {
                /* req.params.pug is set by storyteller.js and is site.pug|verbose.pug */
                text: pug.compileFile(__dirname + '/../sections/' + req.params.pug, {
                    pretty: true
                })(pageinfo)
            };
        });
};

module.exports = serveSite;
