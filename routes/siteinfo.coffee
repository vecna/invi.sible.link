_ = require 'lodash'
{handleRequest} = require '../lib/routes-helpers'
{NotValid, NotFound} = require '../lib/errors'
siteinfo = require '../lib/siteinfo'

# Compact an object by removing all keys with an undefined value.
compactObj = (obj) ->
  _.reduce obj, (memo, v, k) ->
    if v? then _.merge(memo, "#{k}": v) else memo
  , {}

constructProfile = (id, siteinfo) ->
  compactObj
    siteinfoId: id,
    name: siteinfo.name ?= undefined

module.exports =
  list: handleRequest siteinfo.all
  show: handleRequest siteinfo.get, ['siteinfo']
