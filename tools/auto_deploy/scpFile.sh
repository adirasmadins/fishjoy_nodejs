#!/bin/bash


while read line;
do
    eval "$line"
done < config.cfg

echo 'AUTH:'$AUTH
echo 'IPLIST:'$IPLIST
echo 'SCP_FILE:'$SCP_FILE
echo 'SCP_PATH:'$SCP_PATH
#部署服务器，安装nvm、node
for line in `cat ./ips/$IPLIST`
do
 echo ${line}
  hostname=`echo $line | cut -d \, -f 1`
  ip=`echo $line | cut -d \, -f 2`
  user=`echo $line | cut -d \, -f 3`
  password=`echo $line | cut -d \, -f 4`
  port=`echo $line | cut -d \, -f 5`
#复制
echo '服务器【'${hostname}':'${ip}'】文件复制中...'
scripts/scp.sh $PACK_DIR/$SCP_FILE $ip:$SCP_PATH $port $AUTH $user $password
echo '服务器【'${hostname}':'${ip}'】文件复制完成'

done
