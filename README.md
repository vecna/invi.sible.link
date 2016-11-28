# components

Design of the architecture behind invi.sible.link

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

execute activities in user time, no 

  * provide direction to chopsticks (promises theory)
  * receive all the operation results of every promises absolved
  * provide stats for the admin on what is happening
  * is managed by admins and only by them

## chopsticks

**Runs on the vantage point**

perform web connection, is a pipeline, 

composition pipeline:
  retriveLists,
    phantom | thug,
    (phantomNavigator?)
    phantomCleaner | thugCleaner,
    reportAnomalies,
    fullifyPromises,
    mongo

## exposer

**Runs where chopstick runs** 7300

expose via API in a raw version what the chopsticks exectutions 
results are. 

## socialpressure

**Runs whenever**

generate output for the social media, fetch from storyteller API

# requirements

mongodb, node, npm, `npm install`
