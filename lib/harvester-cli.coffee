_ = require 'lodash'
winston = require 'winston'
{nestedOption, assertEnv} = require './utils'
{join} = require 'path'
debug = require('debug')('harvester')
{harvest} = require './harvest'
Promise = require 'bluebird'
{jsonReader} = require './jsonfiles'
fs = require 'fs'
Promise.promisifyAll fs

yargs = require 'yargs'
  .nargs('k', 1).alias('k', 'kind').string('k')
            .choices('k', ['CO', 'CA', 'crawl'])
  .nargs('s', 1).alias('s', 'slots').string('s')
            .describe('s', 'default: $N,0,$N')
  .config('c')
  .help 'h'
  .alias 'h', 'help'
  .demand(['k', 's', 'c'])

_(yargs)
  .pick (v, k) -> _.isPlainObject(v)
  .each (v, k) ->
    _(nestedOption k, v).pairs().each((e) ->
      process.env[e[0]] = e[1] unless process.env[e[0]]?).value()
  .value()
# The section above do not work if you update lodash to 4.3.x

process.env.COREURL = yargs.parsed.argv.coreurl
process.env.DUMP = yargs.parsed.argv.dump
process.env.KIND = yargs.parsed.argv.kind
process.env.SLOTS = yargs.parsed.argv.slots

# Map of file associated througth --kind option
dumpFname =
  CA: "categories"
  CO: "countries"
  crawl: "sites"

# Configure logging.
winston.remove winston.transports.Console
winston.add winston.transports.Console, timestamp: true, colorize: true

if process.env.KIND == 'crawl'
  Promise.all( [ jsonReader join process.env.DUMP, dumpFname.CA ,
                 jsonReader join process.env.DUMP, dumpFname.CO ] )
    .then (v) ->
      debug "Apparentemente OK ?"
      console.log(v)
      process.exit 1
else 
  referenceFile = join process.env.DUMP, dumpFname[process.env.KIND] + ".json"
  fs.statAsync process.env.DUMP
    .then ->
      # this read the previous status and get updated in the next .then! 
      return jsonReader referenceFile
    .catch ->
      fs.mkdirAsync process.env.DUMP
      return []
    .then (pStatus) ->
      debug "Reloaded %d entries from %s", _.size(pStatus), referenceFile
      return jsonReader yargs.parsed.argv.countries
        .then (countryMap) ->
          crawlStatus =
            categories: yargs.parsed.argv.categories
            pages: yargs.parsed.argv.pages
            countries: countryMap
            pStatus: pStatus
          return crawlStatus
    .then (crawlStatus) ->
      return harvest crawlStatus, dumpFname[process.env.KIND], process.env.SLOTS
    .tap (results) ->
      debug "  Ω Saving in %s the updated results %d entries", referenceFile, _.size(results)
      # TODO has to be an append and/or shared DB memory whatever, not a file!
      fs.writeFileAsync referenceFile, JSON.stringify(results, undefined, 2)
    .then (results) ->
      debug "Well done: %s", _.size(results)
      process.exit 0
    .catch (e) ->
      winston.error 'Harvester broke: %s', e.message
      winston.error e.stack
      process.exit 1

