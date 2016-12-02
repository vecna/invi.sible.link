_ = require('lodash');
moment = require('moment');

function serializeLists(collection) {

    return _.map(collection, function(singleList) {
        var listInfo = _.pick(singleList, 
            ['id', 'subject_id', 'name', 'kind', 'trueOn', 'creationTime']);
        listInfo.siteCount = _.size(singleList.pages);
        return listInfo;
    });

};

module.exports = {
    serializeLists: serializeLists
}
