#!/usr/bin/env nodejs
var _ = require('lodash');

var debug = require('debug')('director');
var Promise = require('bluebird');
var moment = require('moment');
var spawnCommand = require('./lib/cmdspawn');

var PATH = ['campaigns'];

var C = [{
    name: 'irantrex',
    cfgf: "irantrex/iran1st.csv" },{
    name: 'clinics-MX',
    cfgf: "chuptrex/clinics-MX.csv" },{
    name: 'clinics-CL',
    cfgf: "chuptrex/clinics-CL.csv" },{
    name: 'clinics-BR',
    cfgf: "chuptrex/clinics-BR.csv" },{
    name: 'clinics-CO',
    cfgf: "chuptrex/clinics-CO.csv" },{
    name: 'halal',
    cfgf: "amtrex/halal-list.csv" },{
    name: 'culture',
    cfgf: "amtrex/culture-list.csv" },{
    name: 'mosques',
    cfgf: "amtrex/mosques-list.csv" },{
    name: 'travel',
    cfgf: "amtrex/travel-list.csv" },{
    name: 'itatopex',
    cfgf: "itatopex/lista.csv" },{
    name: 'gptrex',
    cfgf: "gptrex/gptrex.csv" },{
    name: 'catalunya',
    cfgf: "catalunya/lista.csv" }
];

var confs = ['config/dailyBadger.json', 'config/dailyPhantom.json'];

function rollDirections(o) {
    debug("%s", path.join(PATH, o.cfgf) );
    debugger;
    _.each(confs, function(kindOf) {
        return spawnCommand({
            binary: '/usr/bin/env',
            args: [ 'nodejs', 'bin/directionTool.js' ],
            environment: {
                needsfile: kindOf
                csv: path.join(PATH, a),
                taskName: o.name 
            }
        }, 0);
    });
}


debug("%j", C);

return Promise
    .map(C, rollDirections)
    .reduce(function(memo, r) {
        memo += r;
        return memo;
    }, 0)
    .then(function(total) {
        console.log(total);
    });

