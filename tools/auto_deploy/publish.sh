#!/bin/bash


while read line;
do
    eval "$line"
done < config.cfg

echo 'INSTALLER_ZIP:'$INSTALLER_ZIP
echo 'INSTALL_DIR:'$INSTALL_DIR
echo 'PACK_DIR:'$PACK_DIR
echo 'AUTH:'$AUTH
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

#复制安装包
echo '服务器【'${hostname}':'${ip}'】安装包复制...'
scripts/scp.sh $PACK_DIR/$INSTALLER_ZIP $ip:$INSTALL_DIR $port $AUTH $user $password 
echo '服务器【'${hostname}':'${ip}'】安装包复制完成'

#解压安装程序
echo '服务器【'${hostname}':'${ip}'】安装包解压...'
scripts/unzip-installer.sh $ip $port $AUTH $user $password $INSTALL_DIR/$INSTALLER_ZIP $INSTALL_DIR
echo '服务器【'${hostname}':'${ip}'】安装包解压完成'

done
