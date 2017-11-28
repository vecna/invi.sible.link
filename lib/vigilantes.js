#!/usr/bin/env nodejs
var _ = require('lodash');
var debug = require('debug')('lib:vigilantes');

var fields = [ "_id", "kind", "start", "id", "href",
  "campaign", "when", "description", "rank", "subjectId" ];

function dump(promises, verbosity) {

    _.each(['badger', 'basic'], function(c) {
        var f = _.filter(promises, {kind: c});
        var x = _.map(f, function(p) {
            return { 'keys': _.size(_.keys(p)) - _.size(fields) };
        });

        if(verbosity)
            debug("%s", JSON.stringify(_.sample(f), undefined, 2));

        debug("Type %s, %d Promises, status: %s",
            c, _.size(f),
            JSON.stringify(_.countBy(x, 'keys'), undefined, 2)
        );
    });
}

module.exports = {
    dump: dump
};
