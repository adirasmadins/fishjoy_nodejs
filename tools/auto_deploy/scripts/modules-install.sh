#!/usr/bin/expect

# 安装

if {$argc<6} {
send_user "modules-install parameter except"
exit 1
}

set host [ lindex $argv 0 ]
set port [ lindex $argv 1 ]
set auth [ lindex $argv 2 ]
set user [ lindex $argv 3 ]
set password  [ lindex $argv 4 ]
set installPath  [ lindex $argv 5 ]

puts stderr "modules-install.sh params: host=$host port=$port auth=$auth user=$user password=$password installPath=$installPath"

set timeout -1
spawn ssh ${user}@${host}

# expect {
# "*yes/no" { send "yes\r"}
# "*password:" { send "$password\r" }
# }

expect "*]#"
send "sudo -s\r"
expect "*]#"
send "cd ${installPath}\r"
expect "*]#"
send "npm install --production\r"
send "exit\r"
expect eof
# interact
