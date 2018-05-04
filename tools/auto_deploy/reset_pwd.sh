#!/bin/bash

while read line;
do
    eval "$line"
done < config.cfg

echo 'AUTH:'$AUTH
echo 'SERVER_NEW_PWD:'$SERVER_NEW_PWD
echo 'IPLIST:'$IPLIST

#部署服务器，安装nvm、node
for line in `cat ./ips/$IPLIST`
do
 echo ${line}
  hostname=`echo $line | cut -d \, -f 1`
  ip=`echo $line | cut -d \, -f 2`
  user=`echo $line | cut -d \, -f 3`
  password=`echo $line | cut -d \, -f 4`
  port=`echo $line | cut -d \, -f 5`

#修改密码
echo '服务器【'${hostname}':'${ip}'】修改密码...'
scripts/resetUserPwd.sh $ip $port $AUTH $user $password $SERVER_NEW_PWD
echo '服务器【'${hostname}':'${ip}'】修改密码完成'

done
