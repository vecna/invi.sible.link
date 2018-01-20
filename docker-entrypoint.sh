#!/bin/bash -e

/usr/local/bin/npm install

touch /paso.txt

exec "$@"

