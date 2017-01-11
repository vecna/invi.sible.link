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

## scheduled collectors 

Some high level data and visualisation takes sense only if computed separately.
I was thinking to generalize this sequence of tasks through the toll named
`machete` but it is proven an unproper planning, because the reduction process
changes too much to be generalized.

Therefore, the two scheduled execution currently implemented are:

### statusChecker

It look at the API `/api/v1/system/info` every hour, and keep track of the
load average, disk usage, memorized object in every machine contacted.

### campaingChecker

It look through all the Vantage Point to get information over the subject
of a specific investigation, and update a daily report on the subject.


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

Tooks input from scheduled resuls, generate output for the social media and
contains the logic to automatize activities

# requirements

mongodb, node, npm, `npm install`
