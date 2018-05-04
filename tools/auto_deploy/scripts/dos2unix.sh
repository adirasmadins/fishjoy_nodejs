#!/bin/bas

function read_dir()
    for file in `ls $1
    d
        if [ -d $1"/"$file 
        the
            read_dir $1"/"$file $2"/"$fil
        els
            echo $1"/"$fil
            sed -e 's/.$//' $1"/"$file > $2"/"$fil
            echo $2"/"$fil
        f
    don


PARAMS=

if [ $# -ne $PARAMS 
the
    echo "usage: src_dir target_dir
    return 
f
chmod -R 777 
rm rf $
cp -rf $1 $
read_dir $1 $
