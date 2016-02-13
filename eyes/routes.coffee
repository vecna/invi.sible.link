path = require 'path'
instances = require './routes/instances'
debug = require('debug')('eyes.routes')

module.exports = (app) ->
  app.get '/api/collections', instances.list
  app.post '/api/collections', instances.create
  app.get '/api/collections/:instance', instances.show
  app.put '/api/collections/:instance', instances.update
  app.delete '/api/collections/:instance', instances.remove

  app.get '*', (req, res) ->
    res.sendFile path.resolve(__dirname, 'dist', 'index.html')
