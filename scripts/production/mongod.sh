
#!/bin/sh

# 
# Ubuntu 16.04
# 

# $1 = start, stop or restart
sudo service mongod $1
echo 'you can see the log with [cat /var/log/mongodb/mongod.log]'