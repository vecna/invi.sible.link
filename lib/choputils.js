var _ = require('lodash');
var debug = require('debug')('lib:choputils');
var nconf = require('nconf');

function getVP(maybeVP) {

    var VP = nconf.get('VP');

    if(_.isUndefined(VP) || _.size(VP) === 0 ) {
        console.log("VP, vantage point, is needed in the Environment. forced 'dummy'");
        VP = 'dummy';
    }

    return VP;
}

function composeURL(VP, source, def) {
    var ret = [ source, 'api', 'v1', def.what, VP, def.param ].join('/');
    debug("Composed url for %s: %s", def.what, ret);
    return ret;
};

module.exports = {
    composeURL: composeURL,
    getVP: getVP
};
