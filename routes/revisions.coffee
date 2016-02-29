{handleRequest} = require '../lib/routes-helpers'
revisions = require('../lib/revisions')

list = handleRequest revisions.byUnit, ['profile', 'unit']

module.exports =
  list: list
