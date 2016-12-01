_ = require('lodash');
moment = require('moment');

function serializeLists(collection) {

    return _.map(collection, function(singleList) {
        var listInfo = _.pick(singleList, ['id', 'name', 'source']);
        listInfo.lastUpdate = moment(singleList.lastUpdate).toISOString();
        listInfo.siteCount = _.size(singleList.pages);
        return listInfo;
    });

};

module.exports = {
    serializeLists: serializeLists
}
