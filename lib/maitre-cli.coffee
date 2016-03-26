_ = require 'lodash'
winston = require 'winston'
{nestedOption, assertEnv} = require './utils'
{join} = require 'path'
debug = require('debug')('↻ maître')
{initialize} = require './init'
Promise = require 'bluebird'
{jsonReader} = require './jsonfiles'
lookup = require './lookup'
queries = require './queries'
fs = require 'fs'

Promise.promisifyAll fs

yargs = require 'yargs'
  .nargs('w', 1).alias('w', 'what').string('w')
            .choices('w', ['look'])
  .nargs('i', 1).alias('i', 'intersect').string('i')
            .describe('i', 'category,country (one may be empty)')
  .config('c')
  .help 'h'
  .alias 'h', 'help'
  .demand(['c', 'i'])

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

intersect = argv.i.split(',')
debug("using Intersection of %s", intersect)
category = "Pornography"
sourceC = 'sources'
unitC = 'units'

initialize argv.c
.then (staticInput) ->
  debug "Info, Categories: %j", staticInput.lists.categories
  filteredSite = lookup.byCategory staticInput, category

  debug "The filtered amount of sites are %d", _.size(filteredSite)
  # the last three results in time
  query = queries.buildSourceQuery filteredSite, 3
  debug "query = %j", query

  return mongodb
    .find sourceC, query
    .then (siteT) ->
      console.log "xx I get %d siteT", _.size(siteT)

  return mongodb
    .find('source', {})
    .then (content) ->
        console.log JSON.stringify(content, undefined, 2)


