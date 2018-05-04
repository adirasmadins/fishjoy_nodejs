#!/usr/bin/expect

# 安装node

if {$argc<6} {
send_user "node-install parameter except"
exit 1
}

set host [ lindex $argv 0 ]
set port [ lindex $argv 1 ]
set auth [ lindex $argv 2 ]
set user [ lindex $argv 3 ]
set password  [ lindex $argv 4 ]
set node_version [lindex $argv 5]

puts stderr "node-install.sh params: host=$host port=$port auth=$auth user=$user password=$password node_version=$node_version"

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
send "source /root/.bashrc\r"
expect "*]#"
send "export NVM_NODEJS_ORG_MIRROR=http://nodejs.org/dist\r"
expect "*]#"
send "nvm install $node_version\r"
expect "*]#"
send "nvm use $node_version\r"
expect "*]#"
send "nvm alias default $node_version\r"
send "exit\r"
expect eof
# interac
