_ = require 'lodash'
Promise = require 'bluebird'
debug = require('debug')('lib.mongodb')
utils = require './utils'
mongodb = Promise.promisifyAll require('mongodb')

connectionUri = undefined

aggregate = (coll, query) ->
  Promise.using connection(), (db) ->
    db.collection(coll).aggregateAsync(query)

# String -> Collection -> [{a}] -> Future [{a}]
# Given set operation, a mongodb collection and a list of units, return a
# promise that resolves to a list of units that are the result of the set
# operation of the list of units against the collection. This function can be
# used to determine new or existing units.
setOperation = (operation, collection, units) ->
  ids = utils.specificHashes units
  # This pipeline returns an empty array if no id's were found on the
  # initial match or an array with a single object that contains an hashes
  # array:
  #  [{hashes: [id1, id2, ...]}]
  query = [
    {$match: {_specific_hash: {$in: ids}}}
    {$group: {_id: null, existing: {$addToSet: "$_specific_hash"}}}
    {$project: {existing: 1, new: {$literal: ids}}}
    {$project: {hashes: {"$#{operation}": ["$new", "$existing"]}}}]

  aggregate(collection, query)
  .then (results) ->
    # It's a weirdness of the mongodb driver, if the pipeline got no match,
    # it simply returns an empty array.
    return units if _.isEmpty results

    hashes = _.first(results).hashes
    _.filter units, ({_specific_hash}) -> _.includes hashes, _specific_hash

# String -> Future DbHandler
# Given a MongoDB URI string return a db handler for that MongoDB.
# Use the bluebird dispose pattern with `using`.
connection = ->
  mongodb.MongoClient.connectAsync connectionUri
  .disposer (db) -> db.close()

debugLog = (op, coll) ->
  debug "Query: %s on %s", op, coll

module.exports =
  initialize: (uri) ->
    connectionUri = uri
    @

  find: (coll, query) ->
    debugLog 'find', coll
    Promise.using connection(), (db) ->
      db.collection(coll).find(query).toArray()

  removeAll: (coll) ->
    debugLog 'remove', coll
    Promise.using connection(), (db) ->
      db.collection(coll).drop()

  findOne: (coll, query) ->
    debugLog 'findOne', coll
    Promise.using connection(), (db) ->
      db.collection(coll).find(query).limit(1).next()

  insert: (coll, docs) ->
    debugLog 'insertMany', coll
    Promise.using connection(), (db) ->
      db.collection(coll).insertMany(docs)
      .then (results) -> results.ops

  insertOne: (coll, doc) ->
    debugLog 'insertOne', coll
    Promise.using connection(), (db) ->
      db.collection(coll).insertOne(doc)
      .then (results) -> _.first results.ops

  updateOne: (coll, filter, update) ->
    debugLog 'updateOne', coll
    Promise.using connection(), (db) ->
      db.collection(coll).updateOne filter, update

  removeOne: (coll, selector) ->
    debugLog 'remove', coll
    Promise.using connection(), (db) ->
      db.collection(coll).removeOne(selector)

  aggregate: aggregate
  setOperation: setOperation
  newUnits: _.partial setOperation, 'setDifference'
  duplicateUnits: _.partial setOperation, 'setIntersection'

  MongoError: mongodb.MongoError
  ObjectID: mongodb.ObjectID
  DBRef: mongodb.DBRef
