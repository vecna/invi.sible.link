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
    memo[unit._ls_id_hash] = unit
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
  mongodb.find collection, _ls_id_hash: {$in: ids}

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
    [duplicates, fetchUnitsByIds unitCollection, utils.idHashes(duplicates)]
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

# String -> Collection -> [{a}] -> Future [{a}]
# Store all new relations of a list of units to a collection. Returns a promise
# that resolves to a list of relations that have been stored.
storeNewRelations = (relation, collection, units) ->
  field = "_ls_#{relation}"
  docs =_(units)
    .map (unit) ->
      # In case the unit has no relation of that type.
      return  unless unit[field]?
      ref = new mongodb.DBRef collection, unit._id
      _.zip (ref for i in unit[field]), unit[field]
    .flatten()
    .compact()
    # Make sure that we store correctly multiple references if we have the
    # same relation within the same set of units.
    .reduce (memo, [ref, rel]) ->
      hash = rel._ls_id_hash
      if memo[hash]? then memo[hash]._ls_sources.push ref
      else memo[hash] = _.extend rel, _ls_sources: [ref], _ls_relation: relation
      memo
    , {}

  mongodb.newUnits collection, _.values docs
  .then _.partial(storeUnits, collection)

# Our actual plugin.
module.exports = (val) ->
  envData =
    _ls_created: val.created or moment().toISOString()
    _ls_profile: val.profile.profileId

  units = _(val.data)
    .uniq '_ls_id_hash'
    .map (unit) -> _.extend unit, envData
    .value()

  winston.info "Processing #{_.size(units)} units."

  unitsC = 'units'
  relationsC = 'relations'
  revisionsC = 'revisions'

  storeNewUnits(unitsC, units)
  .then (newUnits) ->
    storeRevisions(revisionsC, unitsC, units)
    .then (revisions) ->
      winston.info "Stored #{_.size(newUnits)} new units."
      winston.info "Stored #{_.size(revisions)} revisions."

      Promise.all [storeNewRelations('images', relationsC, newUnits),
                   storeNewRelations('links', relationsC, newUnits)]
      .spread (images, links) ->
        winston.info "Inserted #{_.size(images)} new relations of type images."
        winston.info "Inserted #{_.size(links)} new relations of type links."

        val.stats = _.extend val.stats,
          uniqueUnits: _.size units
          newUnits: _.size newUnits
          revisions: _.size revisions
          newImages: _.size images
          newLinks: _.size links

        val

module.exports.argv =
  'mongodb.uri':
    type: 'string'
    nargs: 1
    desc: 'The MongoDB connection string.'
    default: 'mongodb://localhost/trackography'
