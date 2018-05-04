#!/bin/bash

function read_dir(){
    for file in `ls $1`
    do
        if [ -d $1"/"$file ]
        then
            read_dir $1"/"$file $2"/"$file
        else
            echo $1"/"$file
            sed -e 's/$/\r/' $1"/"$file > $2"/"$file
            echo $2"/"$file
        fi
    done
}

PARAMS=2

if [ $# -ne $PARAMS ]
then
    echo "usage: src_dir target_dir"
    return 1
fi

rm rf $2
cp -rf $1 $2
read_dir $1 $2
