Twitter = require('twitter')
_ = require "lodash"
Promise = require 'bluebird'
debug = require('debug')('plugin.twitter')
moment = require 'moment'
winston = require 'winston'
{linkIdHash} = require '../lib/transformer'

{assertEnv} = require '../lib/utils'


module.exports = (val) ->
  Promise.try -> assertEnv ['TWITTER_CONSUMER_KEY',
                            'TWITTER_CONSUMER_SECRET',
                            'TWITTER_ACCESS_TOKEN_KEY',
                            'TWITTER_ACCESS_TOKEN_SECRET']
  .then ->
    client = Promise.promisifyAll(new Twitter
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET)

    username = val.profile.twitter
    # Change: check how compose a tweet and send it, because this plugin has just to send some kind of daily public computation.


module.exports.argv =
  'twitter.consumer_key':
    type: 'string'
    nargs: 1
    desc: 'The twitter consumer key.'
  'twitter.consumer_secret':
    type: 'string'
    nargs: 1
    desc: 'The twitter consumer secret.'
  'twitter.access_token_key':
    type: 'string'
    nargs: 1
    desc: 'The twitter access key.'
  'twitter.access_token_secret':
    type: 'string'
    nargs: 1
    desc: 'The twitter access token secret.'
  'twitter.tweet_count':
    default: 200
    nargs: 1
    desc: 'Number of tweets retrived'
  'twitter.retweets':
    default: 0
    nargs: 1
    desc: "Include retweets"
