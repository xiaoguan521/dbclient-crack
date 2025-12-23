# Database Client 破解工具

这个项目提供了一套工具，用于解除VSCode插件 [Database Client](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-mysql-client2) 的付费限制，使所有Premium功能都可用。

## 项目结构

- `crack.js` - 主要的破解脚本，负责修改插件文件
- `run_crack.bat` - Windows用户运行脚本的批处理文件
- `run_crack.sh` - Linux/macOS用户运行脚本的Shell文件
- `UPDATE_README.md` - 详细的更新说明和使用指南

## 主要功能

1. 移除"Premium Only"标记
2. 启用所有付费功能，包括工作区范围选项
3. 移除连接数量限制
4. 阻止插件的网络验证请求
5. 模拟付费用户状态

## 快速开始

### Windows用户

1. 确保已经安装了Node.js
2. 关闭所有编辑器窗口
3. 将本项目的文件复制到插件目录：
   - VSCode: `%USERPROFILE%\.vscode\extensions\cweijan.vscode-mysql-client2-版本号`
   - Cursor: `%USERPROFILE%\.cursor\extensions\cweijan.vscode-mysql-client2-版本号`
   - Antigravity: `%USERPROFILE%\.antigravity\extensions\cweijan.vscode-mysql-client2-版本号`
4. 双击运行`run_crack.bat`
5. 等待完成后重启编辑器

### Linux/macOS用户

1. 确保已经安装了Node.js
2. 关闭所有编辑器窗口 (VSCode/Cursor/Antigravity)
3. 将本项目的文件复制到插件目录：
   - VSCode: `~/.vscode/extensions/cweijan.vscode-mysql-client2-版本号`
   - Cursor: `~/.cursor/extensions/cweijan.vscode-mysql-client2-版本号`
   - Antigravity: `~/.antigravity/extensions/cweijan.vscode-mysql-client2-版本号`
4. 打开终端，进入该目录
5. 运行：`chmod +x run_crack.sh && ./run_crack.sh`
6. 等待完成后重启编辑器

### Python脚本用户 (推荐)

如果您安装了Python 3，可以直接运行 `crack.py`，它会自动搜索以下位置的插件：
- VSCode: `~/.vscode/extensions`
- Cursor: `~/.cursor/extensions`
- Antigravity: `~/.antigravity/extensions`

使用方法：
1. 在任意位置运行: `python3 crack.py`
2. 脚本会自动查找并修补插件 

## 常见问题

如果修改后仍然看到"Premium Only"标记，请参考`UPDATE_README.md`中的额外解决方案，包括：

1. 修改hosts文件阻止网络请求
2. 使用网络代理工具
3. 在断网环境下使用

## 免责声明

本项目仅供学习和研究目的使用，请尊重开发者的劳动成果，有条件的用户请购买正版软件。使用本工具所造成的一切后果由使用者自行承担。 