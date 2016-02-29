_ = require 'lodash'
mongodb = require './mongodb'

# Remind: I've removed the update operation from routes/units.coffee,
# Remind: the amound of LS here is over 9000

unitsC = 'units'

# The order of the array matters. The first publishing date found is chosen.
dateFields = ['source', 'wayback', 'fetch']

setPublishingDate = (unit) ->
  pubDate = _.reduce dateFields, (memo, field) ->
    if not memo? and unit._ls_pubdates?[field]? then unit._ls_pubdates[field]
    else memo
  , null
  _.merge unit, {_ls_publishing_date: pubDate}

unitsWithDate = (units) ->
  _(units)
  .map setPublishingDate
  .filter '_ls_publishing_date'
  .sortByOrder '_ls_publishing_date', 'desc'
  .value()

isExisting = (id) ->
  mongodb.findOne unitsC, _ls_id_hash: id
  .then (result) -> if result? then true else false

get = (id) -> mongodb.findOne unitsC, _ls_id_hash: id


module.exports =
  oneByProfile: (profile, hash, q={}) ->
    mongodb.findOne unitsC, _.extend(q, _ls_profile: profile, _ls_id_hash: hash)
    .then setPublishingDate

  byProfile: (profile, q={}) ->
    mongodb.find unitsC, _.extend(q, _ls_profile: profile)
    .then unitsWithDate

  get: get
