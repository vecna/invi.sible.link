_ = require 'lodash'
Promise = require 'bluebird'
winston = require 'winston'
{join} = require 'path'

plugins = require '../plugins'
{confsource} = require './confinput'
{history} = require './history'
{nestedOption, assertEnv} = require './utils'

debug = require('debug')('cli')

yargs = require 'yargs'
  .nargs('p', 1).alias('p', 'plugins').string('p')
            .describe('p', 'A list of plugins')
  .nargs('i', 1).alias('i', 'input')
            .describe('i', 'input, a key from the config, section "inputs"')
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

if ! (typeof argv.c == "string" && typeof argv.i == "string")
  winston.info "No config -c and input -i, use:"
  console.log "\tfetch:   \t-c config/test_SINGLE.json -i italy -p urlops,fetcher"
  console.log "\tanalysis:\t-c config/test_SIGNLE.json -i companies -p tpa"
  return

# Initialize the mongodb configuration
try
  assertEnv ['MONGODB_URI']
  require('./mongodb').initialize process.env.MONGODB_URI
catch
  winston.info 'No MongoDB connection string found.'

confsource argv.c, argv.input
.then (source) ->
  throw new Error("Profile #{argv.source} not found.")  unless source?

  Promise.using history(source), ({step}) ->
    Promise.reduce argv.plugins.split(','), (val, p) ->
      winston.info "Calling the #{p} plugin."
      winston.info "#{JSON.stringify(source[p])}" if source[p]?
      # debug JSON.stringify(val)
      unless plugins[p]?
        throw new Error("Invalid plug name: #{p}")

      step p
      .then -> plugins[p](val)
    , {source: source, companies: [], data: [], stats: {}}
.then (v) ->
  winston.info 'Pipeline completed.'
  process.exit 0
.catch (e) ->
  winston.error 'Our pipeline broke: %s', e.message
  winston.error e.stack
  process.exit 1
