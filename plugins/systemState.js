var _ = require('lodash');
var debug = require('debug')('plugin:systemState');
var os = require('os');

function systemState(val, conf) {
    _.set(val, 'systemState', {
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem()
    });
    return val;
};

module.exports = systemState;
