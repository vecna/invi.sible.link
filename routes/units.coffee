{NotFound} = require '../lib/errors'
{handleRequest} = require '../lib/routes-helpers'
units = require '../lib/units'

list = handleRequest units.byProfile, ['profile']

show = handleRequest units.oneByProfile, ['profile', 'unit']


module.exports =
  list: list
  show: show
