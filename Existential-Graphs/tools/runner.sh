#!/bin/zsh
# usage: ./runner.sh testfile.js  -- concatenates src + test, runs under JXA
cd "$(dirname "$0")"
cat ../src/*.js "$1" > /tmp/_egrun.js
osascript -l JavaScript -e 'ObjC.import("stdlib");' -e "eval(\$.NSString.stringWithContentsOfFileEncodingError('/tmp/_egrun.js',4,\$()).js)" 2>&1
