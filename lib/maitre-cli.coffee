_ = require 'lodash'
winston = require 'winston'
{nestedOption, assertEnv} = require './utils'
{join} = require 'path'
debug = require('debug')('↻ maître')
Promise = require 'bluebird'
{jsonReader} = require './jsonfiles'
fs = require 'fs'

Promise.promisifyAll fs

yargs = require 'yargs'
  .nargs('w', 1).alias('w', 'what').string('w')
            .choices('w', ['look'])
  .config('c')
  .help 'h'
  .alias 'h', 'help'
  .demand(['c'])

# Configure logging.
winston.remove winston.transports.Console
winston.add winston.transports.Console, timestamp: true, colorize: true


# Load plugin related command line options.
argv = (_.reduce [], (yargs, p) ->
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


# Initialize the mongodb configuration
try
  mongodb = require('./mongodb').initialize argv.mongodb.uri
catch
  winston.info 'No MongoDB connection string found.'
  return


return mongodb
    .find('source', {})
    .then (content) ->
        console.log JSON.stringify(content, undefined, 2)


