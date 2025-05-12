#!/bin/bash

echo "Database Client 破解工具"
echo "============================"
echo "正在尝试移除付费限制..."

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 执行破解脚本
node crack.js

echo "============================"
echo "按Enter键退出..."
read 