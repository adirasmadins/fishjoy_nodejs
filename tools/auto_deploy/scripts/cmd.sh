#!/usr/bin/expect

# 安装运行环境

if {$argc<6} {
send_user "cmd parameter except"
exit 1
}

set host [ lindex $argv 0 ]
set port [ lindex $argv 1 ]
set auth [ lindex $argv 2 ]
set user [ lindex $argv 3 ]
set password  [ lindex $argv 4 ]
set cmd  [ lindex $argv 5 ]



puts stderr "cmd.sh params: host=$host  port=$port auth=$auth user=$user password=$password cmd=$cmd"

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
send "${cmd}\r"
expect "*]#"
send "exit\r"
expect eof
# interact

