# How to do a campaigns
### and what me/you have to do, if you want to do a campaign

This text is intended to define a roadmap for collaborations, as temporarly example, you can check [this experiment](https://american.muslims.tracking.exposed).

### Goal

define the sections of a website doing campaign about third party trackers. The target audience are webmaster (responsible of the
websites), website users (getting more aware) and security/privacy analysts.

### Sections

These are generic block of information that might be completely changed in certain *campaign*, but I'm foreseeing these block to split the task between me and the *campaigner expert*.

  * Introduction: small section explaining the framing of the analysis. explain why third party trackers matter might be tricky, but some report and previous analysis help us. For example, [Amnesty International Data Broker](https://www.amnesty.org/en/latest/research/2017/02/muslim-registries-big-data-and-human-rights/) [Princeton Webcensus analysis](https://webtransparency.cs.princeton.edu/webcensus/), an [article explaining linkability between browsing history and identity](https://www.theatlantic.com/technology/archive/2017/02/browsing-history-identity/515763/) and this is the most chomprensive [link collection, made by Monica Cheng, former Mozilla developer working on tracking protection](http://monica-at-mozilla.blogspot.it/2015/04/some-links-about-tracking-and-security.html).

  * **Categories**: to explain this, let me use an example **healthcare and third party trackers**. The hypothesys is "third party can guess which deasese you are suffering" based on your web activity. You back-question yourself "which website might I look for if I've a deasese?" and the answer is: "wikipedia, some specialized forum, some online clinics". Wikipedia is a special website, the two remaining are the categories.
    * *Why?* Websites have different nature and interaction model. An online clinic has some online Q&A section for patients, services explanation, costs estimation, and then (not all the clinic have it) a private section in which exams results can be downloaded. an health forum instead has section for interest, and if you are a frequent or a casual reader and a tracker can associate your activity to an urgent need, that might be a sensitive informatio. Forums and Clinic, in this example, belong to two different categories.
 
  * **Top tracked website graph**: the visualisation strategy change based on what is communicated. the colorful graph (named sankey) works well to display a limited number of website (10, maximum). Has been done with the idea to display graphically the links between websites third party companies.

  * **Explanation**: after the top tracked website, might be helpful provide a detail explanation of what does it mean. This is the most cospicuos part of the advocacy site, and it is supposed to explain tights, potential or proven, between the companies, the audience and why it is an issue. This page might link to the **user solutions** and **company requests**

  * **Technical analysis**: third parties might use different technology, discriminate the source based on the geographical location, relay on companies who deserve to be contextualized and explain. If this section is made, shall contain more detailed notes about the third parties. Ideally is an introduction for the next pages (intended for a more technical audience), this section might link to the section described below

  * **User solutions**: may vary based on the thread model posed, and this is heavily dependent on the websites, companies, nations and geopolitical relationship involved. still, normally the solution is in script blocking. ADBlocker Plus is the most well known but has a business model that someone consider unfair. UBlock origin is a more technically oriented version. Privacy Badger has and heuristic approach and can be configured gradually. Firefox and Chrome are working (and probably both of them will release by the 2017) a tab based cookie jar, but hardware fingerprint would be always possible if a script do that. This is something we might talk about it to find the most appropriate advices.

  * **Company requests**: digital activist daydreaming here: raise the bar, ask for what is fair. if you are doing awareness on users, and such users are unaware of what is a third party trackers¹

  * **all sites table**: a table containing all the numeric information about the website tested. Different test can be analyed, by default is display only the last. This is a collection of evidences for researcher and webmasters.

  * **single site evidences**: website during their time change the number of third party trackers they have installed. This might be measured to understand how they are changing their third party script policy.

¹ This is the core point: target audience of these campaigns are not persons that would go on Princeton WebCensus or in [Trackography](https://trackography.org), but larger cut of audience triggered by compelling political reasons.

### Who's the campaigner expert?

Is one or more person who:
  * know the sociopolitical context we are talking about.
  * can provide a set of webisite usually related to the target audience of the campaign
  * can write text with the language and the terminology clear for the target audience
  * can explain to policy maker or security analyst the procedure used, letting them providing assesment in their respective fields of expertise
  * can write and maintains HTMLs files

# Technical specification

In this directory you might find the campaigns package cloned (or implemented by you)

In my home istallation I've, for example:

    ۞  ~/Dev/invi.sible.link/campaigns $ ls -l
    drwxrwxr-x 5 oo oo 4096 Mar 26 06:24 amtrex
    drwxrwxr-x 3 oo oo 4096 Abr 18 22:16 intrex
    -rw-rw-r-- 1 oo oo 5859 Abr 17 00:05 README.md
    ۞  ~/Dev/invi.sible.link/campaigns $

the JSON configuration file are located in:


and by read by the command:

    $ campaign=example npm run social-pressure

you get:

    ۞  ~/Dev/invi.sible.link campaign=example npm run social-pressure
    > invi.sible.link@1.0.0 social-pressure /home/oo/Dev/invi.sible.link
    > nodemon --config config/social-pressure.json bin/social-pressure
    [nodemon] 1.11.0
    [nodemon] reading config /home/oo/Dev/invi.sible.link/config/social-pressure.json
    [nodemon] to restart at any time, enter `rs`
    [nodemon] ignoring: /home/oo/Dev/invi.sible.link/.git/**/* .nyc_output .sass-cache bower_components coverage /home/oo/Dev/invi.sible.link/node_modules/**/*
    [nodemon] watching: campaigns/*/pugs/*.pug campaigns/*/*.js campaigns/*/*.css dist/*/***/*
    [nodemon] watching extensions: js,css,json,pug
    [nodemon] starting `node bin/social-pressure index.js`
    [nodemon] child pid: 9050
    [nodemon] watching 127 files
      Loading as campaign config: campaigns/example/config/example-campaign.json +0ms
    http://127.0.0.1:7525 listening


and contains simply information on the interface and the TCP listening port:

    ۞  ~/Dev/invi.sible.link $ cat campaigns/example/config/example-campaign.json 
    {
        "interface": "127.0.0.1",
        "port": 7525
    }

# Campaign repositories content



