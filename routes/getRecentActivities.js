var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('route:getRecentActivities');
var moment = require('moment');
var nconf = require('nconf');

var getInfo = require('../lib/getInfo');
/* This API return a structured amount of information talking about 
 * the activities and the data found in the IVL database. 
 */
function getRecentActivities(req) {

    debug("%s getRecentActivities", req.randomUnicode);

    return Promise.all([
        getInfo.lastDayCount('surface', 'when'),
        getInfo.lastDayCount('evidences', 'when'),
        getInfo.lastDayCount('promises', 'start'),
        getInfo.lastDayCount('statistics', 'when')
    ])
    .then(function(results) {
        return {
          json: results
        };
    });
};
      
module.exports = getRecentActivities;
