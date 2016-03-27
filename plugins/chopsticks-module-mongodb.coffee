_ = require 'lodash'
Promise = require 'bluebird'
debug = require('debug')('plugin.mongodb')
winston = require 'winston'
moment = require 'moment'
mongodb = require '../lib/mongodb'
utils = require '../lib/utils'

# [a] -> {b}
# Map a list of units to a map with the id hashes as key, and the unit as value.
sortUnitsById = (units) ->
  _.reduce units, (memo, unit) ->
    memo[unit._specific_hash] = unit
    memo
  , {}

# [a] -> [a] -> [String, a]
# Given two lists of units with the same id hash, return a list of tuples
# containing the id and the unit of those units, that don't have matching
# content.
matchRevisions = (newUnits, existingUnits) ->
  sortedExistingUnits = sortUnitsById existingUnits
  _(newUnits)
    .filter (unit) -> unit._ls_content_hash?
    .filter ({_ls_id_hash, _ls_content_hash}) ->
      _ls_content_hash isnt sortedExistingUnits[_ls_id_hash]?._ls_content_hash
    .map (unit) -> [sortedExistingUnits[unit._ls_id_hash]._id, unit]
    .value()

# Collection -> [a] -> Future [{b}]
# Given a list of id hashes, fetch all corresponding units from the
# collection. Returns a promise that resolves to the list of fetched units.
fetchUnitsByIds = (collection, ids) ->
  debug("collection = %s", collection)
  mongodb.find collection, _specific_hash: {$in: ids}

# Collection -> [{a}] -> Future [{a}]
# Store a list of units to the collection. Returns a promise that resolves
# to the list of units including the new unit object id.
storeUnits = (collection, units) ->
  return Promise.resolve units  if _.isEmpty units
  mongodb.insert collection, units

# Collection -> String -> Ref -> Future {a}
# Store an additional revision reference on a unit. Returns a promise that
# resolves to the same object that the mongodb driver returns.
updateUnitWithRevision = (collection, unitId, ref) ->
  mongodb.updateOne collection, {_id: unitId}, {$push: {_ls_revisions: ref}}

# Collection -> [{a}] -> Future [{a}]
# Store a list of units to the collection if those units don't exist yet.
# Returns a promise that resolves to the list of units including the new unit
# object id.
storeNewUnits = (collection, units) ->
  mongodb.newUnits collection, units
  .then _.partial(storeUnits, collection)

# Collection -> Collection -> [{a}] -> Future [{a}]
# Given the revision collection and the unit collection, store those units as
# revisions that are already existing, but have different contents. Returns a
# promise that resolves to the list of units that were stored as revisions.
storeRevisions = (revisionCollection, unitCollection, units) ->
  mongodb.duplicateUnits unitCollection, units
  .then (duplicates) ->
    [duplicates, fetchUnitsByIds unitCollection, utils.specificHashes(duplicates)]
  .spread (duplicates, existingUnits) ->
    revisions = matchRevisions duplicates, existingUnits

    Promise.map revisions, ([unitId, revision]) ->
      storeNewUnits revisionCollection, [revision]
      .then ([result]) ->
        return unless result?
        ref = new mongodb.DBRef revisionCollection, result._id
        updateUnitWithRevision unitCollection, unitId, ref
        .return result
    .then (results) -> _(results).flatten().compact().value()


# Our actual plugin.
module.exports = (staticInput, val) ->
  origDLen = _.size(val.data)
  origSLen = _.size(val.source)

  units = _(val.data)
    .uniq '_specific_hash'
    .value()

  prcnt = _.round(_.size(units)/origDLen, 3) * 100
  winston.info "Processing #{_.size(units)} unique units, #{prcnt}% of the original corpus."

  unitsC = 'units'
  revisionsC = 'revisions'
  sourcesC = 'sources'

  # sources are always put, no matter of what, because multiple tests per day can
  # exists: sadly at the moment I'm not using a fine tuned timing, so I've to increase
  # the details of the timeString before send this in production -- TODO
  sources = _(val.source)
    .uniq 'input_hash'
    .value()

  prcnt = _.round(_.size(sources)/origSLen, 2) * 100
  winston.info "Tested #{_.size(sources)} sites, removed dups, kept #{prcnt}%"

  # To store sources, I use not the library function (more oriented to units)
  # but some other home-made shit I'll move in a library soon or never
  mongodb.insert(sourcesC, sources)
  .then (result) ->
    debug("Sources insert results: %d", _.size(result))

    return storeNewUnits(unitsC, units)
    .then (newUnits) ->
      storeRevisions(revisionsC, unitsC, units)
      .then (revisions) ->
        winston.info "Stored #{_.size(newUnits)} new units."
        winston.info "Stored #{_.size(revisions)} revisions."
        val.stats = _.extend val.stats,
          newSources: _.size sources
          uniqueUnits: _.size units
          newUnits: _.size newUnits
          revisions: _.size revisions
        val


module.exports.argv =
  'mongodb.uri':
    type: 'string'
    nargs: 1
    desc: 'The MongoDB connection string.'
    default: 'mongodb://localhost/trackography'
