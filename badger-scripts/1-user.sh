#!/bin/sh
if [ ! -d "badger-scripts" ]; then
    echo "Error, this script has to be run from the invi.sible.link directory";
    exit;
fi
git clone git@github.com:EFForg/privacybadger.git
git clone git@github.com:vecna/badger-claw.git
