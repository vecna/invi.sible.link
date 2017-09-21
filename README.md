# invi.sible.link
### Toolchain command reference

This is toolchain compsed by many small tools. The goal has been reduce 1 functionality per tool. below, or on the [website](https://invi.sible.link) you can find more contextual details. If you want get in touch, [claudio at tracking dot exposed](keybase.io/vecna) is the email to write to, the link lead to the PGP key.

### Installation

Clone the repository, `npm install`, have mongodb running on localhost.
There are two kind of scripts: listening services (they listen via HTTP and execute REST commands) and standalone scripts

## Machines naming

Exists two kind of boxes in invi.sible.link system: the **Vantage Point** (VP) and the **Coordinator**. In my test infrastructure, the Coordinator is [https://invi.sible.link](https://invi.sible.link) and the three VP are *ws-vp.sible.link, ams-vp.sible.link, hk-vp.sible.link*

Using the code in this repository you have all the required software for replicate the analysis I'm doing. Both the boxes install the same package and needs mongodb, just they use different executables.

## listening services

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

## standalone scripts

These are executed when new tests and campaign are going to begin. The commands are intended to be repeated follwing the *crontab scheduling* chapter below.

**coordinate the test for a list of websites**. Requirement: a CSV list, a unique name to be associate to that test:

    DEBUG=*  bin/directionTool.js --csv ../amtrex/culture-list.csv --taskName culture

This command is intended to store a list of website in testing. With the following example you'll download a campaign package, a set of files respecting [this specifics](https://github.com/vecna/invi.sible.link/tree/master/campaigns)

    git@github.com:tracking-exposed/intrex.git
    cd intrex
    npm i

The command above generate such output:

    directionTool CSV source defined in ../intrex/italian-media-2016.csv, I hope is an absolute path +0ms
    directionTool Unspecified 'needsfile' ENV, using default config/dailyNeeds.json +2ms
    directionTool Using config/dailyNeeds.json as needs generator +1ms
    directionTool Importing CSV ../intrex/italian-media-2016.csv +1ms
    directionTool content {"needName":"basic","lastFor":{"number":28,"period":"h"},"startFrom":"midnight"} +3ms
    directionTool Timeframe: startFrom midnight (midnight|now), lastFor {"number":28,"period":"h"} +1ms
    directionTool Window start Mon Apr 17 2017 00:00:00 GMT+0200 end Tue Apr 18 2017 04:00:00 GMT+0200 +2ms
    directionTool 39 lines → keys [site,description] 'rank' will be add +2ms
    directionTool Read 39 sites, everything with rank < 100 will be stripped off +3ms
    directionTool Generated 39 needs +6ms
      directionTool The first is {
      "subjectId": "1c40afc685a418a5098aee28a33f818f5b6c3e14",
      "taskName": "intrex",
      "href": "http://www.repubblica.it",
      "description": "11717",
      "rank": 1,
      "needName": "basic",
      "start": "2017-04-17T00:00:00.000Z",
      "end": "2017-04-18T00:00:00.000Z",
      "id": "58b5d753e732edb69d2cfdf3d683a8b1e76ce49b"
    } +0ms
    lib:mongo writeMany: DONE, in promises 39 objects +36ms

This command has set a list of task to be executed. The **VPs** contact `vigile` asking if there are some task to be done. If `vigile` has something to give back it log:

    route:getTasks Ӫ getTasks max 30 from casa +2m
    route:getTasks taskList returns 30 tasks updated for VP [casa] +76ms
    route:getTasks Ϣ getTasks max 30 from casa +2m
    route:getTasks taskList returns 9 tasks updated for VP [casa] +22ms

Logs the number of task provided to the **VP**, named *casa* in this log. With a maximum of 30 task returned every time, and 39 website to be tested, 

If there are not new task to be delegated, `vigile` log with some *underscores*, like this:

    route:getTasks _________ casa +5ms

### Retrieve information

In the previous section we saw ↓
  * how `directionTool` (in `bin/directionTool`)
  * create `promises` (in mongodb configured in `config/vigile.json` )
  * these promises are dispatch by `vigile` (`bin/vigile` listening on 7200)
  * Vantage Point contact `vigile` when is executed `bin/chopsticks`
  * Vantage Point get the site to be analyzed and save their results in mongodb (`config/chopsticks.json`)
  * Vantage Point notify to `vigile` if the analysis was successful or not, `promises` get updated with this result

Then, from the box running `vigile` and `storyteller` we want retrieve the results obtained and do analysis, aggregation, visualizations.

    DEBUG=* bin/campaignChecker.js --config config/experimentsCampaign.json --campaign intrex

  * campaign: has to be a previously used `taskName` and has to be a field present in `config/experimentsCampaign.json`

This create in mongodb:

  * as many entries in `evidences` as the request/response
  * as many entries in `surface` as the website tested
  * one entry in `sankeys`

# Thug

[thug](https://github.com/buffer/thug) is a powerful instrument used to detect client side attacks. It extend a javascript sandbox and this suits very well to our scope. It is not mandatory for the system to work, but might provide unique results.

### Installing Thug

Following https://buffer.github.io/thug/doc/build.html

    # aptitude install libboost-all-dev graphviz libffi-dev libfuzzy-dev autoconf libgraphviz-dev pkg-config python-pip
    # aptitude install libtiff5-dev libjpeg8-dev zlib1g-dev libfreetype6-dev liblcms2-dev libwebp-dev tcl8.6-dev tk8.6-dev python-tk
    # aptitude install python-libemu libemu-dev
    # pip install pygraphviz --install-option="--include-path=/usr/include/graphviz" --install-option="--library-path=/usr/lib/graphviz/"
    # pip install pyv8
    # pip install thug

(otherwise I'll try with docker it don't work in the vantage point: the requirements here are a lot)

### Experiments with Thug

please refer to the file THUG.md


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
