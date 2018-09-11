#!/bin/sh

site=$1

if [ -z $site ]; then
    echo "required as argument a website"
    exit 1
fi
echo -e "\n`date` -> $site" >> /tmp/monoSiteAdd.log

DEBUG=* bin/queueSite.js --url $site --kind basic
amount=1 concurrency=1 timeout=20 site=$site npm run phantom
DEBUG=* bin/singleSiteResults.js --config config/analyzerDevelopment.json --site $site
