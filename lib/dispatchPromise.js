var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');
var debug = require('debug')('lib:dispatchPromise');

var various = require('./various');

function returnHTTPError(req, res, funcName, where) {
    debug("%s HTTP error 500 %s [%s]", req.randomUnicode, funcName, where);
    res.status(500);
    return false;
};

/* This function wraps all the API call, checking the verionNumber
 * managing error in 4XX/5XX messages and making all these asyncronous
 * I/O with DB, inside this Bluebird */
function dispatchPromise(name, routes, req, res) {

    var apiV = _.parseInt(_.get(req.params, 'version'));

    /* force version to the only supported version */
    if(_.isNaN(apiV) || (apiV).constructor !== Number || apiV != 1)
        apiV = 1;

    if(_.isUndefined(req.randomUnicode))
        req.randomUnicode = String.fromCharCode(_.random(0x0391, 0x085e));

    debug("%s %s API v%d name %s (%s)", req.randomUnicode,
        moment().format("HH:mm:ss"), apiV, name, req.url);

    var func = _.get(routes, name, null);

    if(_.isNull(func))
        return returnHTTPError(req, res, name, "is null");

    return new Promise.resolve(func(req))
      .then(function(httpresult) {

          if(!_.isUndefined(httpresult.json)) {
              debug("%s API %s success・returning JSON (%d bytes)",
                  req.randomUnicode, name,
                  _.size(JSON.stringify(httpresult.json)) );
              res.json(httpresult.json)
          } else if(!_.isUndefined(httpresult.text)) {
              debug("%s API %s success・returning text (size %d)",
                  req.randomUnicode, name, _.size(httpresult.text));
              res.send(httpresult.text)
          } else {
              httpresult.error = "Undetermined failure";
              returnHTTPError(req, res, name, "Undetermined failure");
          }

          /* is a promise, the actual return value don't matter */
          return various.accessLog(name, req, httpresult);
      });
/*
      .catch(function(error) {
          debug("%s Trigger an Exception %s: %s",
              req.randomUnicode, name, error);
          return returnHTTPError(req, res, name, "Exception");
      });
 */
};

module.exports = dispatchPromise;
