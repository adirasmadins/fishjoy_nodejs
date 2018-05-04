#!/usr/bin/expect

#scp.sh
#远程拷贝文件
# ./scp.sh 本地文件 远程路径 远程用户密码
 
if {$argc<6} {
send_user "parameter except"
exit 1
}
 
set localfile [ lindex $argv 0 ]
set remotefile [ lindex $argv 1 ]
set port [ lindex $argv 2 ]
set auth [ lindex $argv 3 ]
set user [ lindex $argv 4 ]
set password [ lindex $argv 5 ]

puts stderr "scp.sh params: localfile=$localfile remotefile=$remotefile port=$port auth=$auth user=$user password=$password"

set timeout -1

spawn scp -P ${port} ${localfile} ${user}@${remotefile}     

if { ${auth} == 1 } {
    puts "enable passwd"
    expect {
    "*yes/no" { send "yes\r"}
    "*password:" { send "$password\r" }
    }
}

send "exit\r"
expect eof
