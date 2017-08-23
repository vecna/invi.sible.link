#!/bin/sh
if [ ! -d "badger-scripts" ]; then
    echo "Error, this script has to be run from the invi.sible.link directory";
    exit;
fi
# my fork contains few modification for the pipeline
git clone git@github.com:vecna/privacybadger.git
git clone git@github.com:vecna/badger-claw.git
echo "Cloned the two repository"
