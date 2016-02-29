_ = require 'lodash'
mongodb = require './mongodb'
units = require './units'

module.exports =
  byUnit: (profile, hash, q={}) ->
    units.oneByProfile profile, hash, _ls_revisions: {$exists: true}
    .then (unit) ->
      revs = _.map unit._ls_revisions, (rev) -> rev.oid
      mongodb.find 'revisions', _.extend(q, _id: {$in: revs})
