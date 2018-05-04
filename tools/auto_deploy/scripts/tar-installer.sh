#!/usr/bin/expect

# 安装

if {$argc<7} {
send_user "unzip-installer parameter except"
exit 1
}

set host [ lindex $argv 0 ]
set port [ lindex $argv 1 ]
set auth [ lindex $argv 2 ]
set user [ lindex $argv 3 ]
set password  [ lindex $argv 4 ]
set zipInstaller  [ lindex $argv 5 ]
set installPath  [ lindex $argv 6 ]

puts stderr "unzip-installer.sh params: host=$host port=$port auth=$auth user=$user password=$password zipInstaller=$zipInstaller installPath=$installPath"

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
send "sudo -s\r"
expect "*]#"
send "tar -zvxf ${zipInstaller} -C ${installPath}\r"
expect "*]#"
send "exit\r"
send "exit\r"
expect eof
# interac
