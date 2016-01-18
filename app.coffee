_ = require 'lodash'
express = require 'express'
http = require 'http'
path = require 'path'
nconf = require 'nconf'
winston = require 'winston'
logger = require 'express-winston'
errorHandler = require 'errorhandler'
serveStatic = require 'serve-static'
bodyParser = require 'body-parser'

# Instantiate the app
app = express()
server = require('http').createServer(app)

# When true, do a graceful shutdown by refusing new incoming request.
gracefullyClosing = false

# Load the app configuration
nconf = require('nconf')
  .env separator: '_'
  .file app.get('env'), "config/#{app.get('env')}.json"

# Configure our node app for all environments
app.set 'port', process.env.PORT or 8000

switch app.get 'env'
  when 'development' or 'staging'
    app.use errorHandler()

app.use logger.logger
  transports: [new winston.transports.Console colorize: true]
  expressFormat: true
  colorStatus: true

# Parse the body as JSON
app.use bodyParser.json()

app.use (req, res, next) ->
  return next() unless gracefullyClosing
  res.setHeader "Connection", "close"
  res.send 502

app.use serveStatic(path.join(__dirname, 'dist'),
  'index': ['index.html'])

# Configure access to mongodb
require('./lib/mongodb').initialize nconf.get('mongodb:uri')

# Set up our routes
require('./routes')(app)

app.use logger.errorLogger
  transports: [new winston.transports.Console json: true, colorize: true]

# Lets start our HTTP server and listen on our specified port
httpServer = server.listen app.get('port')

# Gracefully shutdown on SIGTERM
# Note: This might not work very well with websockets, in that case close
# those connections manually and retry on the client.
process.on 'SIGTERM', ->
  gracefullyClosing = true
  console.log "Received kill signal (SIGTERM), shutting down gracefully."
  # Wait for existing connections to close, and exit the process
  httpServer.close ->
    console.log "Closed out remaining connections."
    process.exit()

  # Our patience to wait has a limit
  setTimeout ->
    console.error "Could not close connections in time, forcefully shutting down"
    process.exit(1)
  , 30*1000

process.on 'uncaughtException', (err) ->
  console.log 'uncaught exception', err, err.stack
