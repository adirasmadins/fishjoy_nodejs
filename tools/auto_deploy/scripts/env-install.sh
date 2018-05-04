#!/usr/bin/expect

# 安装运行环境

if {$argc<5} {
send_user "env-install parameter except"
exit 1
}

set host [ lindex $argv 0 ]
set port [ lindex $argv 1 ]
set auth [ lindex $argv 2 ]
set user [ lindex $argv 3 ]
set password  [ lindex $argv 4 ]


puts stderr "env-install.sh params: host=$host auth=$auth user=$user password=$password port=$port"

set timeout -1

spawn ssh -p ${port} ${user}@${host}

if { ${auth} == 1 } {
    puts "enable passwd"
    expect {
    "*yes/no" { send "yes\r"}
    "*password:" { send "$password\r" }
    }
}

expect "*]#"
send "npm install omelo -g\r"
expect "*]#"
send "yum -y install sysstat\r"
expect "*]#"
send "yum -y install unzip\r"
send "exit\r"
expect eof
# interact
