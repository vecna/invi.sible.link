#!/bin/sh
# tested on the Ubuntu vantage points
echo "Please: add 'universe' in the repo"
tail -f /dev/zero
vim /etc/apt/source.list

apt-get update
apt-get install -y make zip # pb needs these
apt-get install -y python-pip
apt-get install -y chromium-browser chromium-chromedriver xvfb
cd badger-claw
pip install -r requirements.txt
cd ..
