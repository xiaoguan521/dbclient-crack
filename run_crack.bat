@echo off
echo Database Client 破解工具
echo ============================
echo 正在尝试移除付费限制...

cd /d %~dp0
node crack.js

echo ============================
echo 请按任意键退出...
pause > nul 