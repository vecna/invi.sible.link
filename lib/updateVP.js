var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var debug = require('debug')('route:updateVP');
var nconf = require('nconf');

var route = require('../routes/getTasks.js');
var mongo = require('../lib/mongo');

function core(selector, vp, value) {
    return mongo
        .read(nconf.get('schema').promises, selector)
        .then(_.first)
        .then(function(p) {
            if(!p && !p.id) throw new Error("Invalid .id");
            _.set(p, vp, value);
            return mongo
                .updateOne(nconf.get('schema').promises, { _id: p._id }, p)
                .return(p);
        });
}

function updateVP(selector, vp, value) {
    debug("Single update of %j to VP %s = %s", selector, vp, value);
    return core(selector, vp, value);
}

function updateVPs(siteList, vp, value) {
    debug("List update %d promises marking VP %s = %s",
        _.size(siteList), vp, value);
    return Promise.map(siteList, function(s) {
        return core({ id: s.id}, vp, value);
    });
}

module.exports = {
    byList: updateVPs,
    byId: updateVP
};
