#!/usr/bin/expect

# 部署nvm

if {$argc<5} {
send_user "nvm-install parameter except"
exit 1
}

set host [ lindex $argv 0 ]
set port [ lindex $argv 1 ]
set auth [ lindex $argv 2 ]
set user [ lindex $argv 3 ]
set password  [ lindex $argv 4 ]

puts stderr "nvm-install.sh params: host=$host port=$port auth=$auth user=$user password=$password"

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
send "curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash\r"
expect "*]#"
send "exit\r"
expect eof
# interact
