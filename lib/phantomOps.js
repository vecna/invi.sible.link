_ = require('lodash');
moment = require('moment');
debug = require('debug')('lib:phantomOps');

var coreFields = [ 'url', 'requestTime', 'target',
                   'promiseId', 'domainId', 'urlId',
                   'VP', 'subjectId' ];

function shrinkMeanings(collection) {

    return _.values(_.reduce(collection, function(memo, e) {
        if(e.target) {
            memo[e.promiseId] = _.pick(e, coreFields);
            memo[e.promiseId].thirdparties = 0;
            memo[e.promiseId].scripts = 0;
        } 

        if(!memo[e.promiseId])
            debug("Problema!");

        if(!e.target)
            memo[e.promiseId].thirdparties += 1;

        if(e['Content-Type'] && e['Content-Type'].match('script'))
            memo[e.promiseId].scripts += 1;

        return memo;
    }, {}));

};

function serializeList(collection) {
    return _.map(collection, function(e) {
        return _.pick(e, coreFields);
    });
}

module.exports = {
    serializeList: serializeList,
    shrinkMeanings: shrinkMeanings
};
