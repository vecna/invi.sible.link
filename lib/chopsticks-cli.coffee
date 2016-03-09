_ = require 'lodash'
Promise = require 'bluebird'
winston = require 'winston'
{join} = require 'path'
fs = require 'fs'
plugins = require '../plugins'
{initialize} = require './init'
{history} = require './history'
{nestedOption, assertEnv} = require './utils'
debug = require('debug')('cli')

Promise.promisifyAll fs

yargs = require 'yargs'
  .nargs('p', 1).alias('p', 'plugins').string('p')
            .describe('p', 'A list of plugins')
  .nargs('r', 1).alias('r', 'random').string('r')
            .describe('r', 'pick a random sample of sites')
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
# The section above do not work if you update lodash to 4.3.x

# Configure logging.
winston.remove winston.transports.Console
winston.add winston.transports.Console, timestamp: true, colorize: true

if ! (typeof argv.c == "string" && typeof argv.p == "string")
  winston.info "No options passed in commnd line, -p and -c required"
  return

# Initialize the mongodb configuration
try
  assertEnv ['MONGODB_URI']
  require('./mongodb').initialize process.env.MONGODB_URI
catch
  winston.info 'No MongoDB connection string found.'

debugger;

initialize argv.c, argv.r
.then (inputs) ->

  Promise.using history(inputs.source), ({step}) ->
    Promise.reduce argv.plugins.split(','), (val, p) ->
      winston.info "Calling the #{p} plugin."
      winston.info "#{JSON.stringify(inputs.source[p])}" if inputs.source[p]?
      unless plugins[p]?
        throw new Error("Invalid plug name: #{p}")

      step p
      .then -> plugins[p](val)
      # BUG: debugflow is hardcoded but I've to check in config if save or not, and the dest
      .tap -> debug "  Ω Saving in debugflow/%s.output the current data envelope", p
      .tap -> fs.writeFileAsync ('debugflow/' + p + ".output"), JSON.stringify(val, undefined, 2)
    , { source: inputs.source, companies: inputs.companies, data: [], stats: {}, analytics: {} }
.then (v) ->
  winston.info 'Pipeline completed.'
  process.exit 0
.catch (e) ->
  winston.error 'Our pipeline broke: %s', e.message
  winston.error e.stack
  process.exit 1
