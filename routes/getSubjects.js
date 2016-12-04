var _ = require('lodash');
var Promise = require('bluebird');
var debug = require('debug')('getSubjects');
var nconf = require('nconf');
 
var mongo = require('../lib/mongo');
var subjectsOps = require('../lib/subjectsOps');

function getSubjects(req) {
    /* don't take any option yet */

    return mongo
        .read(nconf.get('schema').subjects, {
            'public': true
        })
        .then(function(subjects) {
            debug("%s getSubjects = %d",
                req.randomUnicode, _.size(subjects));
            return {
                json: subjectsOps.serializeLists(subjects)
            };
        });
};

module.exports = getSubjects;
