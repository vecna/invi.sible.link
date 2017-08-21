#!/bin/sh
# tested on the Ubuntu vantage points, 
# they HAS TO BE RUNNED AFTER root-dep.sh
cd privacybadger 
make
git commit -a -m "xxx"
make
echo "supposedly now is create the .crx"
ls *.crx
cp *.crx ../badger-claw
