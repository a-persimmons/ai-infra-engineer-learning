# Linux 命令速查表

基础设施工程师必备 Linux 命令快速参考。

---

## 文件与目录操作

### 导航
```bash
# Print working directory
pwd

# List files
ls
ls -l  # Long format
ls -la  # Include hidden files
ls -lh  # Human-readable sizes
ls -ltr  # Sort by time, reverse

# Change directory
cd /path/to/directory
cd ..  # Parent directory
cd ~  # Home directory
cd -  # Previous directory

# Create directory
mkdir mydir
mkdir -p path/to/nested/dir  # Create parent directories

# Remove directory
rmdir mydir  # Only empty directories
rm -r mydir  # Recursive delete
rm -rf mydir  # Force recursive delete
```

### 文件操作
```bash
# Create empty file
touch file.txt

# Copy files
cp source dest
cp -r source_dir dest_dir  # Recursive copy
cp -p file1 file2  # Preserve attributes

# Move/rename files
mv source dest
mv oldname newname

# Remove files
rm file.txt
rm -f file.txt  # Force delete
rm -i file.txt  # Interactive (confirm)

# Create symbolic link
ln -s /path/to/file linkname

# Find files
find . -name "*.txt"
find /path -type f -name "pattern"
find . -mtime -7  # Modified in last 7 days
find . -size +100M  # Files larger than 100MB
```

---

## 查看文件
```bash
# View entire file
cat file.txt

# View with line numbers
cat -n file.txt

# Concatenate files
cat file1.txt file2.txt > combined.txt

# View file page by page
less file.txt
more file.txt

# View first N lines
head file.txt
head -n 20 file.txt

# View last N lines
tail file.txt
tail -n 20 file.txt

# Follow file (real-time updates)
tail -f /var/log/syslog

# View file with syntax highlighting (if installed)
bat file.txt
```

---

## 搜索与过滤

### grep
```bash
# Search in file
grep "pattern" file.txt

# Case-insensitive search
grep -i "pattern" file.txt

# Recursive search in directory
grep -r "pattern" /path/to/dir

# Show line numbers
grep -n "pattern" file.txt

# Show count of matches
grep -c "pattern" file.txt

# Invert match (lines NOT matching)
grep -v "pattern" file.txt

# Extended regex
grep -E "pattern1|pattern2" file.txt

# Search multiple files
grep "pattern" *.txt

# Context lines
grep -A 3 "pattern" file.txt  # 3 lines after
grep -B 3 "pattern" file.txt  # 3 lines before
grep -C 3 "pattern" file.txt  # 3 lines before and after
```

### find
```bash
# Find by name
find /path -name "filename"

# Find by type
find /path -type f  # Files
find /path -type d  # Directories

# Find and execute
find /path -name "*.log" -exec rm {} \;

# Find recently modified
find /path -mtime -1  # Last 24 hours

# Find by size
find /path -size +100M
find /path -size -1M

# Find by permissions
find /path -perm 644
```

---

## 文本处理

### sed
```bash
# Replace text (first occurrence)
sed 's/old/new/' file.txt

# Replace all occurrences
sed 's/old/new/g' file.txt

# Replace in-place
sed -i 's/old/new/g' file.txt

# Delete lines
sed '/pattern/d' file.txt

# Print specific lines
sed -n '5,10p' file.txt  # Lines 5-10
```

### awk
```bash
# Print specific column
awk '{print $1}' file.txt

# Print with delimiter
awk -F':' '{print $1, $3}' /etc/passwd

# Sum column
awk '{sum+=$1} END {print sum}' file.txt

# Print lines matching pattern
awk '/pattern/ {print}' file.txt
```

### cut
```bash
# Cut by character position
cut -c1-10 file.txt

# Cut by delimiter
cut -d',' -f1,3 file.csv

# Cut by field
cut -f1 file.txt
```

### sort 与 uniq
```bash
# Sort file
sort file.txt

# Sort numerically
sort -n file.txt

# Reverse sort
sort -r file.txt

# Sort by column
sort -k2 file.txt

# Remove duplicates
sort file.txt | uniq

# Count duplicates
sort file.txt | uniq -c

# Show only duplicates
sort file.txt | uniq -d
```

---

## 用户与权限管理

### 用户
```bash
# Current user
whoami

# Switch user
su - username

# Run as superuser
sudo command

# Add user
sudo useradd username
sudo adduser username  # Interactive

# Delete user
sudo userdel username
sudo deluser username

# Change password
passwd
sudo passwd username

# View user info
id
id username
```

### 权限
```bash
# Change file permissions
chmod 755 file.txt
chmod u+x file.txt  # Add execute for user
chmod g-w file.txt  # Remove write for group
chmod o+r file.txt  # Add read for others

# Change ownership
chown user file.txt
chown user:group file.txt
chown -R user:group directory/

# Change group
chgrp group file.txt

# View permissions
ls -l file.txt
```

**权限数字：**
- 4 = 读（r）。
- 2 = 写（w）。
- 1 = 执行（x）。
- 755 = rwxr-xr-x（所有者 rwx，组 r-x，其他用户 r-x）。
- 644 = rw-r--r--（所有者 rw，组 r，其他用户 r）。

---

## 进程管理

### 查看进程
```bash
# List processes
ps
ps aux  # All processes, detailed
ps -ef  # Full format

# Process tree
pstree

# Real-time process viewer
top
htop  # Better alternative (if installed)

# Process by name
ps aux | grep process_name

# Show process by PID
ps -p 1234
```

### 管理进程
```bash
# Run in background
command &

# Bring to foreground
fg

# List background jobs
jobs

# Kill process
kill PID
kill -9 PID  # Force kill

# Kill by name
killall process_name
pkill process_name

# Nice (priority)
nice -n 10 command  # Lower priority
renice -n 5 -p PID  # Change priority
```

---

## 磁盘与存储

### 磁盘用量
```bash
# Disk space usage
df -h

# Directory size
du -sh directory/
du -h --max-depth=1 directory/

# Largest directories
du -h | sort -rh | head -10

# Inodes usage
df -i
```

### 挂载
```bash
# List mounted filesystems
mount

# Mount filesystem
sudo mount /dev/sdb1 /mnt/usb

# Unmount
sudo umount /mnt/usb

# List block devices
lsblk
```

---

## 网络命令

### 网络信息
```bash
# IP address
ip addr
ip a
ifconfig  # Older command

# Network interfaces
ip link

# Routing table
ip route
route -n

# DNS lookup
nslookup google.com
dig google.com

# Test connectivity
ping google.com

# Trace route
traceroute google.com
tracepath google.com
```

### 网络连接
```bash
# Active connections
netstat -tulpn
ss -tulpn  # Modern alternative

# Listening ports
netstat -ln
ss -ln

# Check specific port
netstat -an | grep :80

# Download file
wget https://example.com/file.txt
curl -O https://example.com/file.txt

# HTTP request
curl https://api.example.com
```

---

## 软件包管理

### Debian/Ubuntu（apt）
```bash
# Update package list
sudo apt update

# Upgrade packages
sudo apt upgrade
sudo apt dist-upgrade

# Install package
sudo apt install package_name

# Remove package
sudo apt remove package_name
sudo apt purge package_name  # Remove config too

# Search package
apt search package_name

# Show package info
apt show package_name

# Clean cache
sudo apt clean
sudo apt autoclean
```

### RHEL/CentOS（yum/dnf）
```bash
# Update packages
sudo yum update
sudo dnf update  # Newer systems

# Install package
sudo yum install package_name

# Remove package
sudo yum remove package_name

# Search package
yum search package_name

# Show package info
yum info package_name
```

---

## SSH 与远程访问
```bash
# Connect to remote host
ssh user@host

# Connect with specific port
ssh -p 2222 user@host

# Connect with key
ssh -i ~/.ssh/key.pem user@host

# Copy files to remote
scp file.txt user@host:/path/
scp -r directory/ user@host:/path/

# Copy from remote
scp user@host:/path/file.txt .

# Sync directories (rsync)
rsync -avz source/ user@host:/dest/

# Generate SSH key
ssh-keygen -t rsa -b 4096

# Copy SSH key to remote
ssh-copy-id user@host
```

---

## 系统信息
```bash
# System info
uname -a  # All info
uname -r  # Kernel version

# OS version
cat /etc/os-release
lsb_release -a

# CPU info
lscpu
cat /proc/cpuinfo

# Memory info
free -h
cat /proc/meminfo

# Disk info
lsblk
fdisk -l

# System uptime
uptime

# Last logged in users
last
who
w

# System logs
journalctl  # systemd systems
tail -f /var/log/syslog
```

---

## 实用单行命令
```bash
# Find and delete files older than 30 days
find /path -type f -mtime +30 -delete

# Find largest files
find /path -type f -exec ls -lh {} \; | sort -k5 -rh | head -10

# Count files in directory
find /path -type f | wc -l

# Check which ports are listening
sudo netstat -tulpn | grep LISTEN

# Kill all processes by name
pkill -9 process_name

# Monitor log file
tail -f /var/log/syslog | grep ERROR

# Create backup with timestamp
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/backup

# Find and replace in multiple files
find . -type f -name "*.txt" -exec sed -i 's/old/new/g' {} \;

# Check disk I/O
iostat -x 1

# Monitor network traffic
iftop  # If installed
nethogs  # If installed

# Create directory and cd into it
mkdir mydir && cd mydir

# Find broken symlinks
find /path -type l ! -exec test -e {} \; -print
```

---

## 性能监控
```bash
# CPU usage
top
htop
mpstat 1

# Memory usage
free -h
vmstat 1

# Disk I/O
iostat -x 1
iotop  # If installed

# Network I/O
iftop  # If installed
nload  # If installed

# Overall system stats
dstat
```

---

## 实用技巧

1. **Tab 自动补全**：按 Tab 补全路径及命令。
2. **命令历史**：按上箭头或使用 history 查看以前的命令。
3. **反向搜索**：按 Ctrl+R 搜索命令历史。
4. **别名**：添加至 ~/.bashrc：
   ```bash
   alias ll='ls -lah'
   alias df='df -h'
   alias free='free -h'
   ```
5. **使用 man 手册**：man command 查看详细文档。
6. **使用 tldr**：安装 tldr 查看简明手册。
7. **管道命令**：组合命令，如 `ps aux | grep python | grep -v grep`。
8. **重定向输出**：command > file.txt（覆盖），或使用 >>（追加）。
9. **后台任务**：增加 & 在后台运行。
10. **Screen/tmux**：保持会话持续运行。

---

**另见：**
- [Docker 速查表](./docker-cheat-sheet.md)
- [Kubernetes 速查表](./kubernetes-cheat-sheet.md)
- [Git 速查表](./git-cheat-sheet.md)

> 译注：原始命令及英文注释保留。删除、格式化、权限修改、进程终止等操作前确认目标及影响，避免直接在生产执行。
