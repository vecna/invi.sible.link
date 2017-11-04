var _ = require('lodash');
var debug = require('debug')('route:doneTask');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var updateVP = require('../lib/updateVP');

function doneTask(req) {
    /* switch the $VantagePoint: false to true */
    var vantagePoint = req.params.vantagePoint;
    var pid = {id: req.params.id, kind: req.params.type};

    debug("doneTask, marking confirmation for %j", pid);

    return updateVP.byId(pid, vantagePoint, true)
        .then(function(c) { 
            return {
                json: _.extend(pid, {'result': 'OK'})
            }
        });
};

module.exports = doneTask;
