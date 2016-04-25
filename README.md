# Trackography-2

Trackography is an app permiting to monitor the trackers exposure. Runs in desktop environment, using a node.js pipeline and the output of the setup can be seen at https://tracking.exposed (not yet online)

![Image Alt](https://raw.githubusercontent.com/vecna/trackography-2/master/Shuttleworth%20Funded.jpg)

Other organization can run their own tests. They can be meaningful to understand third party trackers, and verify is targeted malvertising campaign are performed.

### share the effort to spot malwertising

This is also a distribute honeynet clinet side, to spot at large how profiling change pervasiveness per country or per context. 

Normally malware is said to be malicious software aimed to extract personal information: what is happening with the javascript vector? Task such as collection, correlation, and mapping of the target to deploy an exploit can be scripted or done separately. The pipeline connects to a configurable list of websites and perform statistics on third parties presence, script size and URL. 

In the next milestones, will improve the analysis of the scripts.

### Other research

[WebXRay](http://webxray.org/)

### Project really short history

This project get the first serious fresh life with in [MyShadow](https://myshadow.org/trackography), as part of TacticalTech. Now is a new second version done with the lesson learnt from [the past](http://trackography.github.io/).

In the first release, ee were dedicated to analyze the national and local Media(s). In this second release a more generic approach has been adopted. In this release the network mapping with traceroute is removed too. It is far more dedicated in third party trackers measurement, instead of exposure of users.

### Install

    git clone https://github.com/vecna/trackography-2
    cd trackography-2
    npm install

    bin/chopsticks [... pipeline options ] 

### Run the webserver 

    cd trackography-2
    node_modules/.bin/gupl server

# Pipeline usages (just the basic two!)

The pipeline basically process the raw input or the previously processed input

# Run the collection system

### 1) have some websites!

### 2) fetch 

    DEBUG=* bin/chopsticks -p fromList,stripper,fetcher -c config/your_config.json 

### 3) analysis

    DEBUG=* bin/chopsticks -p fromList,stripper,resume,jsonLoad,companies,analysis,ranks,leaders -c config/test_SINGLE.json 

# Data source

The data that get updates here are three:

  * the target website, for every website is necessary a list of country associated and for every country a number of daily users
  * the tracking company files
  * the daily (or based on your periodic testing) output of the pipeline 'fetcher' process

# Basic rules

  * the target URLs are pick from config/url/*.json files, as defined in the config/file.json given 

# Plugins kind

all the plugins are in 'plugins/' directory, they can be used in the pipeline, the formalisation of indepotent/potent functions is ongoing.

## TODO

plugins input and output

# Cool external resources

https://www.ghostery.com/support/global-opt-out/
https://app.ghosteryenterprise.com/TM/PI2VVQ
http://staysafeonline.org/blog/50-things-a-server-can-tell-when-you-visit-a-webpage
https://webcookies.org

[Method and system for one tag trafficking in display advertising to achieve personalized ad experiences at scale](http://www.google.com/patents/US20110119125)
