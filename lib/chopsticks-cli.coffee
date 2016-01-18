_ = require 'lodash'
Promise = require 'bluebird'
winston = require 'winston'
{join} = require 'path'

plugins = require '../plugins'
profiles = require './profiles'
{history} = require './history'
{nestedOption, assertEnv} = require './utils'

debug = require('debug')('cli')

yargs = require 'yargs'
  .nargs('p', 1).alias('p', 'plugins').string('p').describe('p', 'A list of plugins')
  .nargs('i', 1).alias('i', 'profile').describe('i', 'The id of the profile.')
  .config('c')
  .help 'h'
  .alias 'h', 'help'

# Load plugin related command line options.
argv = (_.reduce plugins, (yargs, p) ->
  if p.argv? then yargs.options p.argv else yargs
, yargs).argv

# Copy the command arguments into the environment.
_(argv)
  .pick (v, k) -> _.isPlainObject(v)
  .each (v, k) ->
    _(nestedOption k, v).pairs().each((e) ->
      process.env[e[0]] = e[1] unless process.env[e[0]]?).value()
  .value()

# Configure logging.
winston.remove winston.transports.Console
winston.add winston.transports.Console, timestamp: true, colorize: true

# Initialize the mongodb configuration
try
  assertEnv ['MONGODB_URI']
  require('./mongodb').initialize process.env.MONGODB_URI
catch
  winston.info 'No MongoDB connection string found.'


profiles.get argv.profile
.then (profile) ->
  throw new Error("Profile #{argv.profile} not found.")  unless profile?

  Promise.using history(profile), ({step}) ->
    Promise.reduce argv.plugins.split(','), (val, p) ->
      winston.info "Calling the #{p} plugin."
      winston.info "#{JSON.stringify(profile[p])}"  if profile[p]?
      # debug JSON.stringify(val)
      unless plugins[p]?
        throw new Error("Invalid plug name: #{p}")

      step p
      .then -> plugins[p](val)
    , {profile: profile, data: [], stats: {}}
.then (v) ->
  winston.info 'Finished the LSD.'
  process.exit 0
.catch (e) ->
  winston.error 'Our pipeline broke: %s', e.message
  winston.error e.stack
  process.exit 1
