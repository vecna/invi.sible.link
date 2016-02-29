path = require 'path'
profiles = require './routes/profiles'
units = require './routes/units'
revisions = require './routes/revisions'
history = require './routes/history'

module.exports = (app) ->
  app.get '/api/profiles', profiles.list
  app.post '/api/profiles', profiles.create
  app.get '/api/profiles/:profile', profiles.show
  app.put '/api/profiles/:profile', profiles.update
  app.delete '/api/profiles/:profile', profiles.remove

  app.get '/api/profiles/:profile/units', units.list
  app.get '/api/profiles/:profile/units/:unit', units.show
#  app.put '/api/profiles/:profile/units/:unit', units.update

  app.get '/api/profiles/:profile/units/:unit/revisions', revisions.list

  app.get '/api/history', history.list

  app.get '*', (req, res) ->
    res.sendFile path.resolve(__dirname, 'dist', 'index.html')
