{NotFound} = require '../lib/errors'
{handleRequest} = require '../lib/routes-helpers'
units = require '../lib/units'

list = handleRequest units.byProfile, ['profile']
# bugs, these do not exists anymore...
show = handleRequest units.oneByProfile, ['profile', 'unit']


module.exports =
  list: list
  show: show
