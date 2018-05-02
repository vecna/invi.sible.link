# invi.sible.link

how to install:

  * ubuntu 16.04 or superior
  * `git clone the repository`
  * `apt-get install mongodb nodejs npm`
  * `npm install` (some other dependencies will raise here, for phantomjs)
  * `badger-scripts/1-user.sh`
  * `sudo badger-scripts/2-root.sh`
  * `badger-scripts/3-user.sh`


### Toolchain command reference

## Command scripts

    $ DEBUG=* bin/queueMany.js --itatopex --catalunya --halal

remind: with **+** means **only badger**, with **-**, means **only phantom**. without imply both

    $ DEBUG=* bin/queueCampaign.js --csv path/to/list.csv --campaign itatopex --kind badger

This commands provide more control, if --kind is not specifiy, all are inserted.

    $ DEBUG=* bin/queueSite.js --url http://www.giantitp.com --kind badger

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

## scheduled collectors 


**statusChecker**
This tool is scheduled to collect status every 10 minutes.

It look at the API `/api/v1/system/info` every hour, and keep track of the
load average, disk usage, memorized object in every machine contacted. the
results goes in localhost:7000/stats
(example on https://invi.sible.link/stats )

**bin/analyzeBadger.js**
**bin/analyzeGroup.js**
**bin/analyzePhantom.js**

This runs one per day per campaign, sequence: Group at the end.

(actually, at the moment I'm using the script `analyzer-unrolled.sh` call at the end 
of the analysis. It is not the optimal way.)

It look through all the Vantage Point to get information over the subject
of a specific investigation, and update a daily report on the subject.

### chopsticks

**Runs on the vantage point**

perform web connection, is a pipeline, can be run in parallel, scheduled,
it constantly execute itself and look for operation to do.

`npm run phantom` or `npm run badger`

### exposer

**Runs where chopstick run**, port 7300

expose via API in a raw version what the chopsticks exectutions, can't
be performed by chopstick itself because this is a webserver and chopstick
has different execution pattern.

## tool (queries)

This can be used to extract evidences and domain based on a specific pattern collected

    mongodb=mongodb://10.0.2.2/ivl company=Criteo node bin/queries.js --config config/storyteller.json 

## ISL-scheduled

```
bin/ISL-scheduled --task campaign --campaign Brasil --config config/brlocal.json --taskName Brasil
```

    * campaign: is looked in the config/brlocal as the campaign selector
    * taskName: is saved in the db (evidences and surface) field `task` used as selector in `/api/v1/mostUniqueTrackers/$taskName`
