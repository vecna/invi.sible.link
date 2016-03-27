var _ = require('lodash'),
    moment = require('moment');

var buildSourceQuery = function(sites, numberofdays) {
    var today = moment().format('YYMMDD')
        hash_list = _.reduce(sites, function(memo, site) {
            // TODO check 'today' - numberofdays
            memo.push(site.input_hash);
            return memo;
    }, []);
    return { input_hash : { $in: hash_list }, when: { $gt: 160322 } };
};

module.exports = {
    buildSourceQuery: buildSourceQuery
};
