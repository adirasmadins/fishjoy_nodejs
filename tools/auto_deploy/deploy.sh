#!/bin/bash

#部署服务器，安装nvm、node

while read line;
do
    eval "$line"
done < config.cfg

echo 'NODE_VER:'$NODE_VER
echo 'INSTALL_DIR:'$INSTALL_DIR
echo 'NODE_INSTALL_DIR:'$NODE_INSTALL_DIR
echo 'NODE_ZIP:'$NODE_ZIP
echo 'AUTH:'$AUTH
echo 'IPLIST:'$IPLIST

for line in `cat ./ips/$IPLIST`
do
  hostname=`echo $line | cut -d \, -f 1`
  ip=`echo $line | cut -d \, -f 2`
  user=`echo $line | cut -d \, -f 3`
  password=`echo $line | cut -d \, -f 4`
  port=`echo $line | cut -d \, -f 5`

  #创建安装目录
  #echo '服务器【'${hostname}':'${ip}'】创建安装目录...'
  #scripts/cmd.sh $ip $port $AUTH $user $password 'mkdir -p '$INSTALL_DIR
  #echo '服务器【'${hostname}':'${ip}'】创建安装目录完成'

  #服务器时间同步
  # echo '服务器【'${hostname}':'${ip}'】服务器时间同步...'
  # scripts/cmd.sh $ip $port $AUTH $user $password 'yum -y install ntp ntpdate'
  # scripts/cmd.sh $ip $port $AUTH $user $password 'ntpdate cn.pool.ntp.org'
   scripts/echo_append.sh $ip $port $AUTH $user $password '0 23 * * * ntpdate asia.pool.ntp.org >> /var/log/ntpdate.log' '/var/spool/cron/root'
   scripts/cmd.sh $ip $AUTH $user $password 'service crond restart'
  # scripts/cmd.sh $ip $AUTH $user $password 'hwclock --systohc'
  # echo '服务器【'${hostname}':'${ip}'】服务器时间同步完成'

  #安装nvm
  #echo '服务器【'${hostname}':'${ip}'】安装nvm开始...'
  #scripts/nvm-install.sh $ip $port $AUTH $user $password
  #echo '服务器【'${hostname}':'${ip}'】安装nvm完成'

  #安装node
  #echo '服务器【'${hostname}':'${ip}'】安装node开始...'
  #scripts/node-install.sh $ip $port $AUTH $user $password $NODE_VER
  #echo '服务器【'${hostname}':'${ip}'】安装node完成'

  #复制NODE包
  #echo '服务器【'${hostname}':'${ip}'】复制NODE包...'
  #scripts/scp.sh $PACK_DIR/$NODE_ZIP $ip:$INSTALL_DIR $port $AUTH $user $password
  #echo '服务器【'${hostname}':'${ip}'】复制NODE包完成'

  #解压NODE包
  #echo '服务器【'${hostname}':'${ip}'】解压NODE包...'
  #scripts/tar-installer.sh $ip $port $AUTH $user $password $INSTALL_DIR/$NODE_ZIP $NODE_INSTALL_DIR
  #echo '服务器【'${hostname}':'${ip}'】解压NODE包完成'

  #安装运行库
  #echo '服务器【'${hostname}':'${ip}'】安装运行库开始...'
  #scripts/env-install.sh $ip $port $AUTH $user $password
  #echo '服务器【'${hostname}':'${ip}'】安装运行库完成'

  #关闭防火墙
  #echo '服务器【'${hostname}':'${ip}'】关闭防火墙...'
  #scripts/cmd.sh $ip $port $AUTH $user $password 'systemctl stop firewalld'
  #echo '服务器【'${hostname}':'${ip}'】关闭防火墙完成'

  #开启CNPM
  #echo '服务器【'${hostname}':'${ip}'】开启CNPM...'
  #scripts/cmd.sh $ip $port $AUTH $user $password 'alias cnpm="npm --registry=https://registry.npm.taobao.org --cache=$HOME/.npm/.cache/cnpm --disturl=https://npm.taobao.org/dist --userconfig=$HOME/.cnpmrc"'
  #echo '服务器【'${hostname}':'${ip}'】开启CNPM完成'

  #删除文件
  #echo '服务器【'${hostname}':'${ip}'】删除文件...'
  #scripts/cmd.sh $ip $port $AUTH $user $password 'rm -rf /opt/fishjoy/servers/shared/cert/coco'
  #echo '服务器【'${hostname}':'${ip}'】删除文件完成'

done
