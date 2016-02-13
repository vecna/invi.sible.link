_ = require 'lodash'
Promise = require 'bluebird'
winston = require 'winston'

mongodb = require './mongodb'
errors = require './errors'

# A decorator to create an express request handler. The handlers are called
# with one argument for every parameter and the request body as the last
# argument, e.g.:
#   handler = (id, body) -> "The return value is the HTTP response"
#   app.put '/path/:id', requestHandler(handler, ['id'])
handleRequest = (handler, params=[]) ->
  (req, res) ->
    args = _(req.params).pick(params).values().value()

    Promise.try -> handler.apply(null, args.concat(req.body))
    .then (results) -> if results? then res.json results else res.end()
    .catch errors.NotFound, (err) ->
      status = 404
      res.status(status).json status: status, msg: err.message
    .catch errors.NotValid, (err) ->
      winston.info req.body
      status = 422
      res.status(status).json status: status, msg: err.message
    .catch mongodb.MongoError, (err) ->
      status = 500
      winston.error err
      res.status(status).json status: status, msg: 'Problems with the datastore.'
    .catch (err) ->
      status = 500
      winston.error err
      res.status(status).json status: status, msg: 'Unidentified error.'

module.exports =
  handleRequest: handleRequest
