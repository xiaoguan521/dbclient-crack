# Database Client 破解工具增强版 v2

## 更新内容

本更新解决了插件在启动后通过网络请求验证许可状态的问题。之前的版本在插件首次启动时可能不会显示"Premium Only"标记，但在一段时间后（可能是验证请求完成后）会重新显示限制。

## 主要改进

1. 拦截并修改了插件的网络验证请求
2. 修改了getUser函数，返回一个虚拟的付费用户信息
3. 替换了所有许可验证相关的API URL
4. 增强了对coreStore-m1eBg2Tl.js文件中许可状态检查的处理 
5. 创建了模拟API响应文件，以便在验证时返回正确的许可信息
6. 更精确地处理连接设置界面中的"Premium Only"标记
7. 修改了package.json中的pricing字段
8. 完善了备份逻辑，避免重复备份

## 使用方法

### Windows 用户

1. 确保已经安装了 Node.js
2. 关闭所有正在运行的 VSCode 窗口
3. 将 `crack.js` 和 `run_crack.bat` 文件复制到插件安装目录（通常是 `%USERPROFILE%\.vscode\extensions\cweijan.vscode-mysql-client2-版本号`）
4. 双击运行 `run_crack.bat`
5. 等待脚本执行完成，然后重新启动 VSCode

### macOS/Linux 用户

1. 确保已经安装了 Node.js
2. 关闭所有正在运行的 VSCode 窗口
3. 将 `crack.js` 和 `run_crack.sh` 文件复制到插件安装目录（通常是 `~/.vscode/extensions/cweijan.vscode-mysql-client2-版本号`）
4. 打开终端，进入插件目录
5. 执行命令：`chmod +x run_crack.sh` 赋予执行权限
6. 执行命令：`./run_crack.sh` 或 `node crack.js`
7. 等待脚本执行完成，然后重新启动 VSCode

## 额外的解决方案

如果重启后仍然出现Premium Only标记，可以尝试以下方法：

### 方法1: 修改hosts文件

通过修改hosts文件，可以阻止插件访问验证服务器：

1. 以管理员身份编辑hosts文件：
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Mac/Linux: `/etc/hosts`
   
2. 添加以下内容:
   ```
   127.0.0.1 database-client.com
   ```

3. 保存文件后重启VSCode

### 方法2: 使用网络代理工具

使用类似Charles或Fiddler的网络代理工具，拦截并修改来自插件的API请求。

### 方法3: 在断网环境下使用

1. 完成破解脚本的执行
2. 断开网络连接
3. 启动VSCode并使用插件
4. 注意：一旦连接网络，可能会再次出现限制

## 问题排查

如果重启后仍然看到"Premium Only"标记或功能限制：

1. 尝试在VSCode中按F1，然后执行 "Developer: Reload Window" 命令
2. 确保完全关闭所有VSCode窗口后再重新打开
3. 检查脚本执行输出，查看是否有错误信息
4. 尝试手动删除插件目录下所有的.bak文件，然后重新运行脚本
5. 使用VSCode开发者工具检查网络请求：
   - 在VSCode中按 Ctrl+Shift+I (Windows/Linux) 或 Cmd+Option+I (Mac) 打开开发者工具
   - 切换到"网络"选项卡
   - 查看是否有对database-client.com的API请求
   - 如果有，说明网络验证机制仍在工作，建议使用上述的额外解决方案

## 注意事项

- 该脚本会自动备份原始文件（添加.bak后缀），如果遇到问题，可以通过恢复这些备份文件来还原
- 每次插件更新后需要重新运行此脚本
- 此工具仅供学习和研究用途 