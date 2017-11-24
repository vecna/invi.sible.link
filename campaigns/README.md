
# How to do a campaigns
### and what me/you have to do, if you want to do a campaign

This text is intended to define a roadmap for collaborations, as temporarly example, you can check [the amtrex experiment](https://american.muslims.tracking.exposed), the [example campaign code](https://github.com/vecna/example) and how the [example looks like](https://example.of.invi.sible.link).

### This document

Define the structure of a website, intended to do a campaign about third party trackers. 

**invi.sible.link** is a framework will provide updated data and code, usable to render graphs and tables. 

**The target audience** of this document are webmaster (responsible for the campaigning website).

**Target audience of the campaign** might go from security/privacy analysts to technically unskilled users if your content is intended to make them more aware on third party tracking 

# How to do campaigns
### and what me/you have to do if you want to do a campaign

This text is intended to clarify some aspect of the framework usage for campaign and analysis.

### Sections

The sections are merely indicative.  A campaign has to be framed by the organization promoting it.
The campaign might leverage on third party privacy, on transport security, policy between states or government surveillance. 

When I made the sections in the [example campaign](https://example.of.invi.sible.link) I mostly tried been generic and provide some inspiration.

### Actual blocks, why are they there?

  * Introduction: small section explaining the framing of the analysis. Explain why third party trackers matter might be tricky, but some report and previous analysis help us. For example, [Amnesty International Data Broker](https://www.amnesty.org/en/latest/research/2017/02/muslim-registries-big-data-and-human-rights/) [Princeton Web census analysis](https://webtransparency.cs.princeton.edu/webcensus/), an [article explaining linkability between browsing history and identity](https://www.theatlantic.com/technology/archive/2017/02/browsing-history-identity/515763/) and this is the most compressive [link collection, made by Monica Cheng, former Mozilla developer working on tracking protection](http://monica-at-mozilla.blogspot.it/2015/04/some-links-about-tracking-and-security.html).

  * **Categories**: to explain this, let me use an example **healthcare and third party trackers**. The hypothesis is "web trackers can guess which disease you are suffering.".
Health issues are understood (with a certain degree of reliability) by algorithms analyzing your network activity. 
But third party trackers can't analyze your health situation on their own. Trackers are installed on content websites: online Clinics, health forum, insurance calculators? 
 
In your investigation might be easier split these websites by categories. A forum has a different responsibility compared to a clinic, and compare online hospitals between them might provide a better impact instead of mixing different types together.

  * **Top tracked website graph**: Based on your campaign, you might figure dedicated visualization. At the moment I opted for a preview (with 10, maximum, websites) in the graph named Sankey. 

Details might be accessible on a table, it looks less cool, but scale independently from the website number.

  * **Explanation/Reasons/Concern**: after the top tracked site, might be helpful provide a detail explanation of what does it mean. This block might be the most conspicuous part of the advocacy site. It is supposed to explain to the audience, why it is an issue. This page might link to the **user solutions**.

  * **User Solutions**: may vary based on the thread model posed, and this is heavily dependent on the websites, companies, nations and geopolitical relationship involved. Still, normally the solution is in script blocking. ADBlocker Plus is the most well known but has a business model that someone considers unfair. UBlock origin is a more technically oriented version. Privacy Badger has and heuristic approach, more you train it, the better it works. Firefox and Chrome are working (and probably both of them will release by the 2017) a tab based cookie jar, but hardware fingerprint would always be possible if a script does that. 

### Who's the campaigner expert?

Is one or more person who:
  * know the sociopolitical context we are talking.
  * can provide a set of website usually related to the target audience of the campaign
  * can write text with the language and the terminology clear for the target audience
  * can explain to policy maker or security analyst the procedure used, letting them providing assessment in their respective fields of expertise
  * can write and maintains HTMLs files

# Technical specification

In this directory, you might find the campaigns package cloned (or implemented by you)

In my home istallation I've, for example:

    ۞  ~/Dev/invi.sible.link/campaigns $ ls -l
    drwxrwxr-x 5 oo oo 4096 Mar 26 06:24 amtrex
    drwxrwxr-x 3 oo oo 4096 Abr 18 22:16 intrex
    -rw-rw-r-- 1 oo oo 5859 Abr 17 00:05 README.md
    ۞  ~/Dev/invi.sible.link/campaigns $

the JSON configuration file is located in:

		campaign/$camaignName/config/$campaignName.json

and is read by executing the command:

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

And then with nginx or apache, you might manage https and do Proxy.


## Personal reminder

git clone git@github.com:tracking-exposed/catalunya.git
git clone git@github.com:tracking-exposed/gptrex.git
git clone git@github.com:tracking-exposed/amtrex.git
git clone git@github.com:tracking-exposed/intrex.git
git clone git@github.com:vecna/itatopex.git
git clone git@github.com:vecna/chuptrex.git
git clone git@github.com:vecna/fiftyshadesofpoland.git
git clone git@github.com:vecna/irantrex.git
