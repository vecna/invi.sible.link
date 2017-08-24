#!/bin/sh
# tested on the Ubuntu vantage points
echo "Please: add 'universe' in the repo (2 seconds to go)"
sleep 2
vim /etc/apt/sources.list

apt-get update
apt-get install -y make zip # pb needs these
apt-get install -y python-pip
apt-get install -y chromium-browser chromium-chromedriver xvfb
cd badger-claw
pip install -r requirements.txt
cd ..
