#!/usr/bin/expect

# 安装运行环境

if {$argc<4} {
send_user "resetUserPwd parameter except"
exit 1
}

set host [ lindex $argv 0 ]
set port [ lindex $argv 1 ]
set auth [ lindex $argv 2 ]
set user [ lindex $argv 3 ]
set password  [ lindex $argv 4 ]
set newPwd  [ lindex $argv 5 ]

puts stderr "cmd.sh params: host=$host  port=$port auth=$auth user=$user password=$password newPwd=$newPwd"

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
send "passwd root\r"
expect "New password:"
send "${newPwd}\r"
expect "Retype new password:"
send "${newPwd}\r"
send "exit\r"
expect eof
# interact
