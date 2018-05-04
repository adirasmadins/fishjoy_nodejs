#!/bin/bash
#ssh免密登陆key生成

while read line;
do
    eval "$line"
done < config.cfg

echo 'AUTH:'$AUTH
echo 'IPLIST:'$IPLIST

for line in `cat ./ips/$IPLIST`
do
  echo ${line}
  host=`echo $line | cut -d \, -f 1`
  ip=`echo $line | cut -d \, -f 2`
  user=`echo $line | cut -d \, -f 3`
  password=`echo $line | cut -d \, -f 4`
  port=`echo $line | cut -d \, -f 5`
  echo '服务器【'${hostname}':'${ip}'】生成授权sshkey...'
  scripts/sshkey.sh $ip $port $user $password | grep ssh-rsa >> ~/.ssh/authorized_keys
  scripts/scp.sh ~/.ssh/authorized_keys $ip:~/.ssh ${port} $AUTH $user $password
  echo '服务器【'${hostname}':'${ip}'】生成授权sshkey完成'

done

