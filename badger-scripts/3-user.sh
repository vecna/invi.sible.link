#!/bin/sh
# tested on the Ubuntu vantage points, 
# they HAS TO BE RUNNED AFTER root-dep.sh
cd privacybadger 
make
git commit -a -m "xxx"
make
echo "supposedly now is create the .crx:"
en=`ls *.crx`
rm -i ../badger-claw/*.crx 
cp $en ../badger-claw
cd ../badger-claw
ln -s $en privacy-badger-symlink.crx
echo "created symlink to $en"
ls -l *.crx
cd ..
