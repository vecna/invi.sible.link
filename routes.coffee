path = require 'path'
units = require './routes/units'
history = require './routes/history'
siteinfo = require './routes/siteinfo'

module.exports = (app) ->
  app.get '/api/siteinfos', siteinfo.list
  app.get '/api/siteinfos/:siteinfo', siteinfo.show

  app.get '/api/siteinfos/:siteinfo/units', units.list
  app.get '/api/siteinfos/:siteinfo/units/:unit', units.show

  app.get '/api/history', history.list

  app.get '*', (req, res) ->
    res.sendFile path.resolve(__dirname, 'dist', 'index.html')
