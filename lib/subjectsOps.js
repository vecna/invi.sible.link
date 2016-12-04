_ = require('lodash');
moment = require('moment');

function serializeLists(collection) {

    return _.map(collection, function(singleList) {
        var listInfo = _.pick(singleList, 
            ['id', 'subjectId', 'name', 'kind', 'trueOn', 'creationTime']);
        listInfo.siteCount = _.size(singleList.pages);
        return listInfo;
    });

};

/* call as map-function */
function getSites(subject) {
    return _.map(subject.pages, function(p) {
        return _.pick(p, ['href', 'id']);
    });
};

module.exports = {
    serializeLists: serializeLists,
    getSites: getSites
};
