var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getCheckURL');
var nconf = require('nconf');
var moment = require('moment');
 
var mongo = require('../lib/mongo');
var company = require('../lib/company');

function getCheckURL(req) {

    var requestedUrl = req.params.check;
    debug("getCheckURL checking %s", requestedUrl);

    var data = {
        page: "requested by API",
        data: [{
            url: requestedUrl
        }]
    };

    company.attribution(data);

    return {
        json: _.first(data.data)
    };
};

module.exports = getCheckURL;
