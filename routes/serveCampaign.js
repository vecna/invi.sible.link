var _ = require('lodash');
var debug = require('debug')('route:serveCampaign');
var Promises = require('bluebird');
var pug = require('pug');
var nconf = require('nconf');

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
    var viz = ["cards", "details"].indexOf(req.params.viz) >= 0 ? req.params.viz : "cards";
    debug("requested campaign page on %s (%s)", campaign, viz);

    var filter = { campaign: campaign };
    return mongo
        .readLimit(nconf.get('schema').judgment, filter, { when: -1 }, 1, 0)
        .then(function(j) {

            console.log(JSON.stringify(j, undefined, 2));
            debugger;
            var total = {
                sites: 44, 
                trackers: 100,
                unrecognized: 122,
                includedJS: 33,
                cookies: 33
            };

            var cinfo = {
                ogtitle: "web trackers in poltical Iranian website",
                pagetitle: "web trackers in poltical Iranian website",
                ogdescription: "We tested " + total.sites + " website, " + total.trackers + " trackers anre recognized and " + total.unrecognized + " are unidentify; (you can contribute to the list)",
                ogurl: "https://invi.sible.link/campaign/" + campaign + "/" + viz,
                ogimageurl: "wip",
                headline: "political opposition in iran, the (uninteded?) web tracking",
                description: "When you access a website, you see a content but the web technology see you. During the years this has created a great market and has influenced the way in which web experiences are developed. In the same way you learn the content, the trackers learn what you are interested on, and gradually, who you are. Here you can an idea about there web trackers present in the website, and remind: it is a decision (maybe, not completely informed) of the website owner, having them installed"
            };

            // debug("Returning campaign with static info %s", JSON.stringify(campaignDict, undefined, 2));
            return {
                text: pug.compileFile(__dirname + '/../sections/campaign.pug')(cinfo)
            };
        });
};

module.exports = serveCampaign;
