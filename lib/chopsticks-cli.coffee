_ = require 'lodash'
Promise = require 'bluebird'
winston = require 'winston'
{join} = require 'path'
fs = require 'fs'
plugins = require '../plugins'
{initialize} = require './init'
{history} = require './history'
{savingPolicy, nestedOption, assertEnv} = require './utils'
debug = require('debug')('↻ cli')

Promise.promisifyAll fs

yargs = require 'yargs'
  .nargs('p', 1).alias('p', 'plugins').string('p')
            .describe('p', 'A list of plugins')
  .nargs('d', 1).alias('d', 'dump').string('d')
            .describe('d', 'the plugins to dump output')
  .config('c')
  .help 'h'
  .alias 'h', 'help'
  .demand(['c', 'p'])

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
# The section above do not work if you update lodash to 4.3.x

# Configure logging.
winston.remove winston.transports.Console
winston.add winston.transports.Console, timestamp: true, colorize: true

# Initialize the mongodb configuration
try
  assertEnv ['MONGODB_URI']
  require('./mongodb').initialize process.env.MONGODB_URI
catch
  winston.info 'No MongoDB connection string found.'

initialize argv.c
.then (inputs) ->

  Promise.using history(inputs.config), ({step}) ->
    Promise.reduce argv.plugins.split(','), (val, p) ->
      winston.info "Calling the #{p} plugin."
      # winston.info "#{JSON.stringify(inputs.source[p])}" if inputs.source[p]?
      unless plugins[p]?
        throw new Error("Invalid plugin name: #{p}")

      step p
      .then -> plugins[p](inputs, val)
      .tap (val) ->
        if savingPolicy(p, argv.dump)
          debugfile = join inputs.config.debug, p + ".json"
          debug "  Ω Saving in %s the current data envelope", debugfile
          return fs.writeFileAsync debugfile, JSON.stringify(val, undefined, 2)
      .tap (val) -> debug "Completed iteration of plugin %s", p
    , {
        source: []
        data: []
        stats: {}
        analytics: {}
      }
.then (v) ->
  winston.info 'Pipeline completed.'
  process.exit 0
.catch (e) ->
  winston.error 'Our pipeline broke: %s', e.message
  winston.error e.stack
  process.exit 1
