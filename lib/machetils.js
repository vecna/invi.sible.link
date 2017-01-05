var _ = require('lodash');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var debug = require('debug')('machetils');
var moment = require('moment');

var mongo = require('../lib/mongo');


function infoObj(nome) {
    return {
        'name': nome,
        'when': new Date()
        /* other info if needed */
    };
};

function D(objz) {
    if(typeof objz === typeof "s")
        debug("%s", objz);
    else if(typeof objz === typeof [])
        debug("%d %j", _.size(objz), _.first(objz));
    else if(typeof objz === typeof {})
        debug("%s", JSON.stringify(objz, undefined, 2));
    else
        debug("D of %j unmanaged", objz);
}


// val = { 
//   .logic
//   .init <-- from initialize
//   .timings = [ .append infoObj ]
//   .downloads = [{.source .data}, {}]
//   .data (remove .download)
//   .finished }
function initialize(logic) {
    debugger;
    return {
        timings: [ infoObj('init') ],
        logic: logic
    };
};

function fetchFrom(source, val) {
    debugger;
};

function singleProcess(val) {
    debugger;
};

function compactList(val) {
    debugger;
};

function collectiveProcess(val) {
    debugger;
};

module.exports = {
  D: D,
  compactList: compactList,
  singleProcess: singleProcess,
  fetchFrom: fetchFrom,
  initialize: initialize,
  collectiveProcess: collectiveProcess
};
