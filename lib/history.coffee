_ = require 'lodash'
Promise = require 'bluebird'
moment = require 'moment'

mongodb = require './mongodb'

now = -> moment.utc().toISOString()

# Log a step to a history entry
step = (id, plugin) ->
  mongodb.updateOne 'history', {_id: id}, {$push: {plugins: plugin}}

# fail a history entry
fail = (id, reason) ->
  mongodb.updateOne 'history',
                    {_id: id},
                    {$set: {state: 'failed', end: now(), reason: reason}}

# close a history entry
end = (id, stats) ->
  mongodb.updateOne 'history',
                    {_id: id},
                    {$set: {state: 'success', end: now(), stats: stats}}

openRun = (profile) ->
  mongodb.insertOne 'history',
    start: now()
    state: 'started'
    plugins: []
    profileId: profile.profileId,
    profileName: profile.name
  .then (result) ->
    id = result._id

    step: _.partial step, id
    fail: _.partial fail, id
    end: _.partial end, id

closeRun = (history, promise) ->
  if promise.isRejected()
    history.fail promise.reason().message
  else
    history.end(promise.value().stats)

history = (profile) ->
  openRun profile
  .disposer closeRun

module.exports =
  history: history
  all: -> mongodb.aggregate 'history', [{$sort: {start: -1}}]
