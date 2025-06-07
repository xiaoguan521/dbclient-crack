/**
 * Database Client 去除付费限制脚本
 * 
 * 该脚本修改相关文件，使插件的付费功能可用
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 获取扩展目录路径
const extensionDir = __dirname;
const extensionJsPath = path.join(extensionDir, 'out', 'extension.js');

console.log('系统类型:', os.platform());
console.log('扩展目录路径:', extensionDir);
console.log('extension.js 路径:', extensionJsPath);

// 检查文件是否存在
if (!fs.existsSync(extensionJsPath)) {
  console.error(`错误: 找不到文件 ${extensionJsPath}`);
  console.log('请确认您是否将脚本放在正确的扩展目录中');
  process.exit(1);
}

console.log('开始修改文件以移除付费限制...');

try {
  // 读取extension.js文件
  let extensionJs = fs.readFileSync(extensionJsPath, 'utf8');
  console.log(`成功读取extension.js文件，大小: ${extensionJs.length} 字节`);

  // 备份原始文件
  const backupPath = path.join(extensionDir, 'out', 'extension.js.bak');
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, extensionJs);
    console.log(`已创建备份文件: ${backupPath}`);
  }

  // 1. 修改isPremium函数 - 始终返回true
  let isPremiumRegex = /static\s+isPremium\s*\(\s*\)\s*\{[\s\S]*?\}/;
  if (isPremiumRegex.test(extensionJs)) {
    extensionJs = extensionJs.replace(isPremiumRegex, 'static isPremium() { return true; }');
    console.log('成功修改 isPremium 函数');
  } else {
    console.log('未找到 isPremium 函数，尝试其他模式...');
    // 尝试其他可能的模式
    isPremiumRegex = /isPremium\s*\(\s*\)\s*\{[\s\S]*?\}/;
    if (isPremiumRegex.test(extensionJs)) {
      extensionJs = extensionJs.replace(isPremiumRegex, 'isPremium() { return true; }');
      console.log('成功修改 isPremium 函数（替代模式）');
    } else {
      console.log('警告: 无法找到 isPremium 函数');
    }
  }

  // 2. 修改isExpire函数 - 始终返回false
  let isExpireRegex = /static isExpire\([^)]*\) \{[\s\S]*?\}/;
  if (isExpireRegex.test(extensionJs)) {
    extensionJs = extensionJs.replace(isExpireRegex, 'static isExpire(e) { return false; }');
    console.log('成功修改 isExpire 函数');
  } else {
    console.log('未找到 isExpire 函数');
  }

  // 3. 修改isPay函数 - 始终返回true
  let isPayRegex = /static isPay\([^)]*\) \{[\s\S]*?return[\s\S]*?\}/;
  if (isPayRegex.test(extensionJs)) {
    extensionJs = extensionJs.replace(isPayRegex, 'static isPay(e) { return true; }');
    console.log('成功修改 isPay 函数');
  } else {
    console.log('未找到 isPay 函数');
  }

  // 4. 修改getUser函数 - 返回一个虚拟的付费用户信息
  let getUserRegex = /static getUser\(\) \{[\s\S]*?\}/;
  if (getUserRegex.test(extensionJs)) {
    extensionJs = extensionJs.replace(getUserRegex, `static getUser() { 
      return { 
        id: "cracked", 
        email: "premium@example.com", 
        username: "premium_user", 
        expireTime: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).getTime(),
        isPremium: true,
        license: "premium"
      };
    }`);
    console.log('成功修改 getUser 函数');
  } else {
    console.log('未找到 getUser 函数');
  }

  // 5. 查找并修改许可验证相关的API请求函数
  // 封锁网络请求验证
  extensionJs = extensionJs.replace(
    /(https?:\/\/|['"](https?:\/\/))database-client\.com\/api\//g, 
    '$1localhost:1234/api/'
  );
  extensionJs = extensionJs.replace(
    /(https?:\/\/|['"](https?:\/\/))database-client\.com\/#\/console\//g, 
    '$1localhost:1234/#/console/'
  );

  // 6. 修改任何可能用于验证的函数
  extensionJs = extensionJs.replace(
    /async checkLicense\([^)]*\)\s*\{[\s\S]*?\}/g,
    'async checkLicense() { return true; }'
  );
  
  extensionJs = extensionJs.replace(
    /async verifyLicense\([^)]*\)\s*\{[\s\S]*?\}/g,
    'async verifyLicense() { return true; }'
  );
  
  extensionJs = extensionJs.replace(
    /async activateLicense\([^)]*\)\s*\{[\s\S]*?\}/g,
    'async activateLicense() { return true; }'
  );

  // 保存前检查文件权限
  try {
    fs.accessSync(path.dirname(extensionJsPath), fs.constants.W_OK);
  } catch (err) {
    console.error(`错误: 没有写入权限 ${path.dirname(extensionJsPath)}`);
    console.log('请尝试使用管理员/sudo权限运行此脚本');
    process.exit(1);
  }

  // 保存修改后的文件
  try {
    fs.writeFileSync(extensionJsPath, extensionJs);
    console.log('成功保存修改后的extension.js文件');
  } catch (err) {
    console.error('保存文件时出错:', err);
    console.log('请尝试使用管理员/sudo权限运行此脚本');
    process.exit(1);
  }

  // 修改webview中的相关文件
  const webviewAssetsDir = path.join(extensionDir, 'out', 'webview', 'assets');
  if (fs.existsSync(webviewAssetsDir)) {
    console.log(`找到webview资源目录: ${webviewAssetsDir}`);
    
    // 列出目录中的所有文件
    console.log('目录中的文件:');
    try {
      const files = fs.readdirSync(webviewAssetsDir);
      files.forEach(file => console.log(`- ${file}`));
    } catch (err) {
      console.error('读取目录内容时出错:', err);
    }
    
    // 需要重点修改的文件模式
    const priorityPatterns = [
      /^connect-.*\.js$/,  // 连接界面
      /^app-.*\.js$/,      // 应用核心文件
      /^Result-.*\.js$/,   // 结果显示
      /^Main-.*\.js$/,     // 主界面
      /^coreStore-.*\.js$/, // 核心存储
      /^Plan-.*\.js$/      // 付费计划相关
    ];

    // 查找目录中所有的JS文件
    let allJsFiles = [];
    try {
      allJsFiles = fs.readdirSync(webviewAssetsDir)
        .filter(file => file.endsWith('.js') && !file.endsWith('.bak'));
      console.log(`找到 ${allJsFiles.length} 个JS文件`);
    } catch (err) {
      console.error('读取assets目录失败:', err);
    }

    // 处理所有JS文件
    for (const fileName of allJsFiles) {
      const filePath = path.join(webviewAssetsDir, fileName);
      const isPriority = priorityPatterns.some(pattern => pattern.test(fileName));
      
      if (fs.existsSync(filePath)) {
        try {
          console.log(`正在修改 ${fileName}${isPriority ? ' (优先文件)' : ''}...`);
          let fileContent = fs.readFileSync(filePath, 'utf8');
          
          // 创建备份
          const backupFilePath = filePath + '.bak';
          if (!fs.existsSync(backupFilePath)) {
            fs.writeFileSync(backupFilePath, fileContent);
          }
          
          // 1. 替换isPay相关检查
          fileContent = fileContent.replace(/(!|\!)([a-zA-Z0-9_]+)\.isPay/g, 'false');
          fileContent = fileContent.replace(/([a-zA-Z0-9_]+)\.isPay/g, 'true');
          fileContent = fileContent.replace(/C\(t\)\.isPay/g, 'true');
          fileContent = fileContent.replace(/W\(a\)\.isPay/g, 'true');
          
          // 2. 替换 hidden 属性，确保 Premium Only 标记被隐藏
          fileContent = fileContent.replace(/hidden:!([a-zA-Z0-9_]+)\.isPay/g, 'hidden:true');
          fileContent = fileContent.replace(/hidden:([a-zA-Z0-9_]+)\.isPay/g, 'hidden:true');
          fileContent = fileContent.replace(/hidden:!C\(t\)\.isPay/g, 'hidden:true');
          fileContent = fileContent.replace(/hidden:C\(t\)\.isPay/g, 'hidden:true');
          fileContent = fileContent.replace(/hidden:!d\.value/g, 'hidden:true');
          fileContent = fileContent.replace(/hidden:!f\.value/g, 'hidden:true');
          fileContent = fileContent.replace(/hidden:!a\.value/g, 'hidden:true');
          
          // 3. 处理连接限制的显示文本
          fileContent = fileContent.replace(/Database 5\/3/g, 'Database ∞/∞');
          fileContent = fileContent.replace(/Other 3\/3/g, 'Other ∞/∞');
          fileContent = fileContent.replace(/连接限制: Database 5\/3, Other 3\/3/g, '连接无限制');
          
          // 4. 特别处理"Premium Only"标签文本
          fileContent = fileContent.replace(/value:(["'])Premium Only\1/g, 'value:$1$1');
          fileContent = fileContent.replace(/value=(["'])Premium Only\1/g, 'value=$1$1');
          
          // 5. 特别处理 connect-BtFhhlKZ.js 文件
          if (fileName === 'connect-BtFhhlKZ.js') {
            // 定位并处理Premium Only标签
            fileContent = fileContent.replace(/\{"class":"text-base green mt-1","value":"Premium Only",/g, 
                                           '{"class":"text-base green mt-1","value":"", "hidden":true,');
            
            // 处理连接限制提示
            fileContent = fileContent.replace(/innerHTML:t\.\$t\(`pay\.connectNotice`\)/g, 
                                           'innerHTML:""');
            
            // 确保工作区范围选项可用
            fileContent = fileContent.replace(/disabled:!f\.value/g, 'disabled:false');
            fileContent = fileContent.replace(/disabled:!d\.value/g, 'disabled:false');
            fileContent = fileContent.replace(/disabled:!a\.value/g, 'disabled:false');
          }
          
          // 6. 特别处理 app-rfvkh6uB.js 文件
          if (fileName === 'app-rfvkh6uB.js') {
            fileContent = fileContent.replace(/\{"value":"Premium Only",/g, 
                                           '{"value":"", "hidden":true,');
          }
          
          // 7. 移除许可限制提示
          fileContent = fileContent.replace(/闭源扩展，完整功能需要Premium许可/g, '');
          fileContent = fileContent.replace(/Premium许可将移除此徽章/g, '');
          fileContent = fileContent.replace(/需要Premium/g, '');
          
          // 8. 阻止验证请求 - 修改API请求URL
          fileContent = fileContent.replace(
            /(https?:\/\/|['"](https?:\/\/))database-client\.com\/api\//g, 
            '$1localhost:1234/api/'
          );
          
          // 9. 修改动态验证的状态检查
          // 找到可能进行许可状态检查的代码
          if (fileName === 'coreStore-m1eBg2Tl.js') {
            // 修改许可状态验证逻辑
            fileContent = fileContent.replace(
              /isPay\s*\([^)]*\)\s*\{[^}]*\}/g,
              'isPay(){return true}'
            );
            
            // 检查并修改许可状态的初始化
            fileContent = fileContent.replace(
              /status\s*:\s*{\s*code\s*:\s*[0-9]/g,
              'status:{code:0'
            );
          }
          
          // 10. 特别处理Plan-BHeFVyRe.js付费计划相关文件
          if (fileName === 'Plan-BHeFVyRe.js') {
            // 替换付费状态检查
            fileContent = fileContent.replace(
              /I\.isPay/g, 
              'true'
            );
          }

          // 保存修改后的文件
          fs.writeFileSync(filePath, fileContent);
          console.log(`成功修改 ${fileName}`);
        } catch (err) {
          console.error(`修改 ${fileName} 时出错:`, err);
        }
      } else {
        console.log(`文件 ${fileName} 不存在`);
      }
    }
  }

  // 修改package.json中的pricing
  const packageJsonPath = path.join(extensionDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      let packageJson = fs.readFileSync(packageJsonPath, 'utf8');
      // 备份原始文件
      const packageJsonBackup = packageJsonPath + '.bak';
      if (!fs.existsSync(packageJsonBackup)) {
        fs.writeFileSync(packageJsonBackup, packageJson);
      }
      
      // 替换pricing字段
      packageJson = packageJson.replace(/"pricing"\s*:\s*"Trial"/, '"pricing": "Free"');
      
      fs.writeFileSync(packageJsonPath, packageJson);
      console.log('成功修改 package.json 文件');
    } catch (err) {
      console.error('修改 package.json 时出错:', err);
    }
  }

  // 创建空的模拟验证API响应文件
  try {
    const mockApiDir = path.join(extensionDir, 'mock_api');
    if (!fs.existsSync(mockApiDir)) {
      fs.mkdirSync(mockApiDir, { recursive: true });
    }
    
    // 创建模拟验证响应
    const mockResponsePath = path.join(mockApiDir, 'mock_license_response.json');
    const mockData = {
      code: 0,
      data: {
        id: "cracked",
        email: "premium@example.com",
        username: "premium_user",
        expireTime: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).getTime(),
        isPremium: true,
        license: "premium"
      },
      message: "success"
    };
    
    fs.writeFileSync(mockResponsePath, JSON.stringify(mockData, null, 2));
    console.log('创建了模拟验证响应文件');
  } catch (err) {
    console.error('创建模拟响应文件时出错:', err);
  }

  console.log('所有修改已完成，请重启VSCode以使更改生效。');
  console.log('提示: 如果重启后功能仍受限，请在VSCode中按F1，然后执行 "Developer: Reload Window" 命令，或完全关闭VSCode后重新打开。');
  console.log('注意: 如果使用后仍然出现Premium Only，可能需要在网络设置中断开网络连接后再使用VSCode，或者通过hosts文件将database-client.com指向127.0.0.1');
} catch (err) {
  console.error('修改过程中出错:', err);
} 
