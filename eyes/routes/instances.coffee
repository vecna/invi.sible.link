{handleRequest} = require '../../lib/routes-helpers'
{NotValid, NotFound} = require '../../lib/errors'
profiles = require '../../lib/profiles'

create = (profile) ->
  # FIXME: Add better data validation
  throw new NotValid  unless profile?.profileId?

  profiles.create profile.profileId, profile
  .then (result) ->
    throw new NotValid('Profile already exists')  unless result?
    result

update = (id, profile={}) ->
  #FIXME: Add data validation
  profiles.update id, profile
  .then (result) ->
    throw new NotFound  unless result?
    profiles.get profile

module.exports =
  list: handleRequest profiles.all
  show: handleRequest profiles.get, ['profile']
  create: handleRequest create
  update: handleRequest update, ['profile']
  remove: handleRequest profiles.remove, ['profile']
