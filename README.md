# Trackography-2

Trackography is a project Claudio Agosti made with Tactical Tech, started in the 2013 and completed in 2014. We realize togheder the importance of this mapping, as explained in [MyShadow](https://myshadow.org/trackography), but we realize also a couple of limits in this approach:

  * We were dedicated to analyze the national and local Media(s), and this somehow has caused the increase of overall costs to the the list of [the webiste to test](https://github.com/vecna/trackmap/tree/master/verified_media), 


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

### Run the collection system

    cd trackography-2

    bin/chopsticks -i 


# Data source

The data that get updates here are three:

  * the target website, for every website is necessary a list of country associated and for every country a number of daily users
  * the tracking company files
  * the daily (or based on your periodic testing) output of the pipeline 'fetcher' process


