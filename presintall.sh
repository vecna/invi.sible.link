#!/bin/bash

# Vars
chrome=google-chrome-stable_current_amd64.deb
driver=chromedriver_linux64.zip
driverversion=2.35

# Checking if we are in main dir
if [ ! -d campaigns ]; then
    echo "Error, this script has to be run from the invi.sible.link directory";
    exit;
fi

# My fork contains few modification for the pipeline
if [ ! -d privacybadger ]; then
	git clone git@github.com:vecna/privacybadger.git && echo "Success!"
fi

if [ ! -d badger-claw ]; then
	git clone git@github.com:vecna/badger-claw.git && echo "Success!"
fi

# Add universe ubuntu repo
sudo add-apt-repository universe

# Install packages
sudo apt-get update
sudo apt-get install -y mongo
sudo apt-get install -y make zip # pb needs these
sudo apt-get install -y python-pip
sudo apt-get install -y xvfb unzip

# Download and install chrome
wget https://dl.google.com/linux/direct/$chrome
sudo dpkg -i $chrome
sudo apt-get -f install

# Download and "install" chrome-driver
wget https://chromedriver.storage.googleapis.com/$driverversion/$driver
unzip $driver
sudo mv chromedriver /usr/bin/

# Install pip requirements
cd badger-claw
sudo pip2 install -r requirements.txt
cd ..

# privacybadger patches
cd privacybadger 
make
git commit -a -m "xxx"
make
echo "-----------------------------------"
echo "supposedly now is create the .crx:"
en=`ls *.crx`
echo "-----------------------------------"
echo "deleting *.crx"
cd ../badger-claw
count=`ls -1 *.crx 2>/dev/null | wc -l`
if  [ $count != 0 ]; then
  rm -v *.crx
fi
echo "-----------------------------------"
echo "creating symlink to $en"
cp ../privacybadger/$en .
ln -s $en privacy-badger-symlink.crx
cd ..

# Some cleanings
echo "--------------"
echo "some cleanings"
rm -v $chrome
rm -v $driver
