_ = require 'lodash'
debug = require('debug')('lib.transformer')
crypto = require 'crypto'

hash = (data) ->
  text = if _.isString(data) then data else JSON.stringify(data)
  sha1sum = crypto.createHash('sha1')
  sha1sum.update(text)
  sha1sum.digest('hex')

# Return a unit with a new hash value set.
fieldHasher = (key, fields, unit) ->
  # Make sure that the field and values are always in the same order.
  data = _.reduce fields, (memo, field) ->
    memo.concat [field, _.get(unit, field)]
  , []
  _.merge unit, _.set({}, key, hash(data))

linkIdHasher = _.partial fieldHasher, '_ls_id_hash', ['type', 'href']
specificHref = _.partial fieldHasher, '_specific_hash', ['href','urlSize', 'bodySize']
blurredHref = _.partial fieldHasher, '_blurred_hash', ['domain', 'contentType', 'bodySize' ]

imageIdHasher = _.partial fieldHasher, '_ls_id_hash', ['type', 'href']
imageExifHasher = _.partial fieldHasher, '_ls_exif_hash', ['exif.Format',
  'exif.format', 'exif.size.width', 'exif.size.height', 'exif.Geometry']

# Hash a list of elements in a unit.
hashUnit = (elem, hasher, unit) ->
  hashedElems = _.reduce (unit[elem]), (memo, e) ->
    memo.push hasher(e)
    memo
  , []
  _.extend unit, _.set({}, elem, hashedElems)

# we make sure that we have a set of default fields set.
defaultFields = (unit) ->
  defaults =
    _ls_visible: true
    _ls_links: []
    _ls_images: []
    _ls_pubdates: {}

  _.reduce defaults, (memo, v, k) ->
    memo[k] = v  unless memo[k]?
    memo
  , unit

module.exports =
  # Those two hasher are just hashing non nested structures
  id_hash: _.partial fieldHasher, '_ls_id_hash'
  content_hash: _.partial fieldHasher, '_ls_content_hash'

  # Those hashers are hashing a collection of elements
  linkIdHash: _.partial hashUnit, '_ls_links', (l) ->
    if l.type is 'self' then l else linkIdHasher(l)
  imageIdHash: _.partial hashUnit, '_ls_images', imageIdHasher
  imageExifHash: _.partial hashUnit, '_ls_images', imageExifHasher

  # These are need for the Req/Res
  specificHash: _.partial hashUnit, 'rr', specificHref
  blurredHash: _.partial hashUnit, 'rr', blurredHref

  defaultFields: defaultFields

  # This is the generic hasher
  baseHasher: hash
