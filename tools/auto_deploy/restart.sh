#!/bin/bash


while read line;
do
    eval "$line"
done < config.cfg

echo 'INSTALL_DIR:'$INSTALL_DIR
echo 'AUTH:'$AUTH
echo 'IPLIST:'$IPLIST
echo 'TEST:'$TEST

#部署服务器，安装nvm、node
for line in `cat ./ips/$IPLIST`
do
 echo ${line}
  hostname=`echo $line | cut -d \, -f 1`
  ip=`echo $line | cut -d \, -f 2`
  user=`echo $line | cut -d \, -f 3`
  password=`echo $line | cut -d \, -f 4`
  port=`echo $line | cut -d \, -f 5`

#杀进程
echo '服务器【'${hostname}':'${ip}'重启后台服务...'
scripts/cmd.sh $ip $port $AUTH $user $password 'pkill node'
echo '服务器【'${hostname}':'${ip}' 重启后台服务完成'

done

cd $INSTALL_DIR/servers/
if test $TEST -eq 1
then
omelo start -D
echo 'development started ...'
else
omelo start -e production -D
echo 'production started ...'
fi

