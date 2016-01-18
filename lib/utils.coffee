_ = require 'lodash'
Promise = require 'bluebird'

# String -> [{a}] -> [b]
# Given a list of units, return a list of hashes of these units. `hash` is the
# field name of the hash on the unit.
selectByHash = (hash, units) ->
  _(units)
  .map (unit) -> unit[hash]
  .uniq()
  .value()

retry = (action, cfg={}) ->
  opts = _.extend times: 5, delay: 250, delayModifier: 1.5, cfg

  resolver = (times, delay) ->
    result = Promise.try action
    if times <= 0 then result
    else
      result
        .catch -> Promise.delay delay
        .then -> resolver times-1, delay * opts.delayModifier

  resolver(opts.times, opts.delay)

nestedOption = (prefix, obj) ->
  _.reduce obj, (memo, v, k) ->
    key = "#{prefix}_#{k}".toUpperCase()
    if _.isPlainObject v then _.extend memo, nestedOption("#{key}", v)
    else memo["#{key}"] = v; memo
  , {}

assertEnv = (vars) ->
  v = _.pick process.env, vars
  unless _.eq _.size(v), _.size(vars)
    missingFields = _.difference vars, _.keys(v)
    throw new Error("Environment variable missing: #{missingFields.join(', ')}")

module.exports =
  idHashes: _.partial selectByHash, '_ls_id_hash'
  contentHashes: _.partial selectByHash, '_ls_content_hash'

  nestedOption: nestedOption
  assertEnv: assertEnv
