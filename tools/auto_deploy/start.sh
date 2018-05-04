#!/bin/bash

while read line;
do
    eval "$line"
done < config.cfg

echo 'INSTALL_DIR:'$INSTALL_DIR

cd $INSTALL_DIR/servers/
if test $TEST -eq 1
then
omelo start -D
echo 'development started ...'
else
omelo start -e production -D
echo 'production started ...'
fi
