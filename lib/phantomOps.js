_ = require('lodash');
moment = require('moment');
debug = require('debug')('lib:phantomOps');

function serializeList(collection) {

    return _.map(collection, function(entry) {
        debug("%j", entry);
        return "a";
    });

};

module.exports = {
    serializeList: serializeList
};
