_ = require 'lodash'
mongodb = require './mongodb'

profilesC = 'profiles'

isExisting = (id) ->
  mongodb.findOne profilesC, profileId: id
  .then (result) -> if result? then true else false

create = (id, profile) ->
  isExisting id
  .then (exists) ->
    mongodb.insertOne profilesC, _.merge profile, profileId: id  unless exists

get = (id) -> mongodb.findOne profilesC, profileId: id

all = -> mongodb.find profilesC, {}

remove = (id) -> mongodb.removeOne profilesC, profileId: id

update = (id, profile) ->
  isExisting id
  .then (exists) ->
    mongodb.updateOne profilesC, {profileId: id}, {$set: profile}  if exists

module.exports =
  isExisting: isExisting
  create: create
  get: get
  all: all
  update: update
  remove: remove
