const _ = require('lodash');

const debug = require('debug')('route:getTableauJSON');

const campaignOps = require('../lib/campaignOps');

function getTableauJSON(req) {
  const filter = { campaign: req.params.cname };
  const past = 24;

  debug('%s getTableauJSON filter %j hours %d', req.randomUnicode, filter, past);

  return campaignOps.getEvidences(filter, past)
    .then((all) => {
      const targets = _.filter(all, { target: true });
      let ret = _.reduce(targets, (memo, t) => {
        memo[t.promiseId] = {
          url: t.url,
          requestTime: t.requestTime,
          i: []
        };
        return memo;
      }, {});
      return _.reduce(_.reject(all, { target: true }), (memo, e) => {
        if (_.startsWith(e.url, 'data:')) { return memo; }
        if (!e.company) { return memo; }
        if (!memo[e.promiseId]) {
          debug('missing promiseId in init?');
          return memo;
        }
        const ct = _.replace(_.replace(e['Content-Type'], /.*\//, ''), /;.*/, '');

        if (_.endsWith(ct, 'javascript')) { ct = 'javascript'; } else if (_.endsWith(ct, 'woff')) { ct = 'font'; } else if (_.size(ct) === 0) { ct = 'Unknown'; }

        const d = {
          connects: e.domaindottld,
          company: e.company,
          'Content-Type': ct,
        };
        memo[e.promiseId].i.push(d);
        return memo;
      }, ret);
    })
    .then(_.values)
    .then((reduced) => {
      debug('getTableauJSON returns: %d', _.size(reduced));
      return {
        json: reduced,
      };
    });
}

module.exports = getTableauJSON;
