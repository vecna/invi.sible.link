# invi.sible.link
### Toolchain command reference

## Command scripts

    $ DEBUG=* bin/queueMany.js --itatopex --catalunya --halal

remind: with **+** means **only badger**, with **-**, means **only phantom**. without imply both

    $ DEBUG=* bin/queueCampaign.js --csv path/to/list.csv --campaign itatopex --type badger

This commands provide more control, if --type is not specifiy, all are inserted.

    $ DEBUG=* bin/queueSite.js --url http://www.giantitp.com --type badger

The impact can be see with

    $ DEBUG=* bin/analytics.js

The collection happen with:

    $ npm run badger
    $ npm run phantom

When the collection is complete, the analysis can be done
    
    $ config=config/analyzerDevelopment.json DEBUG=* bin/analyzeBadger.js --campaign catalunya
    $ config=config/analyzerDevelopment.json DEBUG=* bin/analyzePhantom.js --campaign catalunya
    $ config=config/analyzerDevelopment.json DEBUG=* bin/analyzeGroup.js --campaign catalunya

## Servers

(services has to be: storyteller, vigile, optional is social-pressure)

### Vantage Point

(has to run exposer, and `ISL-scheduled --task chopsticks` has to be in crontab every two minutes)

This is toolchain compsed by many small tools. The goal has been reduce 1 functionality per tool. below, or on the [website](https://invi.sible.link) you can find more contextual details. If you want get in touch, [claudio at tracking dot exposed](keybase.io/vecna) is the email to write to, the link lead to the PGP key.

### Installation

Clone the repository, `npm install`, have mongodb running on localhost.
There are two kind of scripts: listening services (they listen via HTTP and execute REST commands) and standalone scripts

## Machines naming

Exists two kind of boxes in invi.sible.link system: the **Vantage Point** (VP) and the **Coordinator**. In my test infrastructure, the Coordinator is [https://invi.sible.link](https://invi.sible.link) and the three VP are *ws-vp.sible.link, ams-vp.sible.link, hk-vp.sible.link*

Using the code in this repository you have all the required software for replicate the analysis I'm doing. Both the boxes install the same package and needs mongodb, just they use different executables.

## Services

on the **Coordinator** server:

    npm run storyteller

`storyteller` is a binary located in `bin/storyteller` using the configuration file `config/storyteller.json`. It listen on the port 7000 in HTTP and serve the public website of the Coordinator box.

    npm run vigile

`vigile` is a binary located in `bin/vigile` using the configuration file `config/vigile.json`. It is consulted by the VPs to get the website to be tested.

When you are managing a campaign there is this command to be executed in the Coordinator box:

    npm run social-pressure

[Here a more extensive explanation on how Campaign works](tree/master/campaigns).

on the vantage point:

    npm run exposer


# Still need revision below
# -------------------------

## invi.sible.link architecture design

**storyteller**: web publisher of lists and results

There are different components because they might run in separated
machines, and because some of them are HTTP servers, other are cron-based
exectuion pipelines.

Additionally, to replicate the advocacy declined for CodingRights 
experiments, this might imply different boxes, management, etc.

### storyteller

**Runs in the public web**, 7000

 * publish the results
 * publish the project work-o-meter
 * report to vigile on the access stats
 * implement basic API
 * fetch the data from machete

### scheduled collectors 

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


### vigile

**Runs in one admin controller machine**, access restricted, 7200

execute activities in user time, no scheduled tasks

  * provide direction to chopsticks, it is where test list are stored
  * receive all the results of every promises resolved (choptstick, machete, socialpressure)
  * receive all the anomalies reported by all the components
  * provide stats for the admin on what is happening
  * is managed by the adminstrators and only by them

### chopsticks

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


### exposer

**Runs where chopstick run**, 7300

expose via API in a raw version what the chopsticks exectutions, can't
be performed by chopstick itself because this is a webserver and chopstick
has different execution pattern.

### socialpressure

**Runs whenever**

Tooks input from scheduled resuls, generate output for the social media and
contains the logic to automatize activities

# How to setup a Vantage Point

```
git clone git@github.com:vecna/invi.sible.link.git
mkdir bin 
cd bin
ln -s ../invi.sible.link/bin/ISL-scheduled 

crontab -e

*/2 * * * * bin/ISL-scheduled --task chopsticks
```

## tool (queries)

This can be used to extract evidences and domain based on a specific pattern collected

    mongodb=mongodb://10.0.2.2/ivl company=Criteo node bin/queries.js --config config/storyteller.json 

## ISL-scheduled

```
bin/ISL-scheduled --task campaign --campaign Brasil --config config/brlocal.json --taskName Brasil
```

    * campaign: is looked in the config/brlocal as the campaign selector
    * taskName: is saved in the db (evidences and surface) field `task` used as selector in `/api/v1/mostUniqueTrackers/$taskName`
