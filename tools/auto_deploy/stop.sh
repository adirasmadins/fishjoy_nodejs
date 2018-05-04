#!/bin/bash


while read line;
do
    eval "$line"
done < config.cfg

echo 'AUTH:'$AUTH
echo 'IPLIST:'$IPLIST
#撑起
for line in `cat ./ips/$IPLIST`
do
 echo ${line}
  hostname=`echo $line | cut -d \, -f 1`
  ip=`echo $line | cut -d \, -f 2`
  user=`echo $line | cut -d \, -f 3`
  password=`echo $line | cut -d \, -f 4`
  port=`echo $line | cut -d \, -f 5`

#杀进程
echo '服务器【'${hostname}':'${ip}'关闭后台服务...'
scripts/cmd.sh $ip $port $AUTH $user $password 'pkill node'
echo '服务器【'${hostname}':'${ip}'关闭后台服务完成'

done
