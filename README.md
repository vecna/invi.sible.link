# invi.sible.link architecture design

**storyteller**: web publisher of lists and results

There are different components because they might run in separated
machines, and because some of them are HTTP servers, other are cron-based
exectuion pipelines.

Additionally, to replicate the advocacy declined for CodingRights 
experiments, this might imply different boxes, management, etc.

## storyteller

**Runs in the public web**, 7000

 * publish the results
 * publish the project work-o-meter
 * report to vigile on the access stats
 * implement basic API
 * fetch the data from machete

## machete

*Machete is good to do everything, is like computadores*
-- a guide in a Costa Rica national park

**Runs potentially where it likes** 7100

 * fetch from the DB the raw results and do the analysis
 * analysis are exposed by storyteller
 * fetch and interpolate third party data

    composition pipeline:
      retrieveSubjects,
        mongo
        irresponsibles,
        frequencies ?
        reportAnomalies,
        reportAnomalies,
        fullifyPromises,
        mongo

      # !MVP/ISL?
      iterateOnInclusions,
        company,
        countries ? (poulation or law)
        unrecognized,
        behavior (after thug ?)
        reportAnomalies,
        fullifyPromises,
        mongo
      

## vigile

**Runs in one admin controller machine**, access restricted, 7200

execute activities in user time, no scheduled tasks

  * provide direction to chopsticks, it is where test list are stored
  * receive all the results of every promises resolved (choptstick, machete, socialpressure)
  * receive all the anomalies reported by all the components
  * provide stats for the admin on what is happening
  * is managed by the adminstrators and only by them

## chopsticks

**Runs on the vantage point**

perform web connection, is a pipeline, can be run in parallel, scheduled,
it constantly execute itself and look for operation to do.

composition pipeline:
  retriveLists,
    phantom | thug,
    (phantomNavigator?)
    phantomCleaner | thugCleaner,
    reportAnomalies,
    fullifyPromises,
    mongo


## exposer

**Runs where chopstick run**, 7300

expose via API in a raw version what the chopsticks exectutions, can't
be performed by chopstick itself because this is a webserver and chopstick
has different execution pattern.

## socialpressure

**Runs whenever**

Tooks input from machete API, generate output for the social media and
contains the logic to automatize activities

# requirements

mongodb, node, npm, `npm install`
