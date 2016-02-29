{handleRequest} = require '../lib/routes-helpers'
history = require '../lib/history'

module.exports =
  list: handleRequest history.all
