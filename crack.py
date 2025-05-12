#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Database Client 去除付费限制脚本 (Python版本)
该脚本修改相关文件，使插件的付费功能可用
"""

import os
import json
import shutil
import re
from pathlib import Path

def backup_file(file_path):
    """创建文件备份"""
    backup_path = str(file_path) + '.bak'
    if not os.path.exists(backup_path):
        shutil.copy2(file_path, backup_path)
        print(f'已创建备份文件: {backup_path}')

def modify_extension_js(extension_js_path):
    """修改extension.js文件"""
    print('开始修改extension.js文件...')
    
    with open(extension_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f'成功读取extension.js文件，大小: {len(content)} 字节')
    
    # 创建备份
    backup_file(extension_js_path)
    
    # 1. 修改isPremium函数
    content = re.sub(
        r'static isPremium\(\) \{[\s\S]*?\}',
        'static isPremium() { return true; }',
        content
    )
    print('成功修改 isPremium 函数')
    
    # 2. 修改isExpire函数
    content = re.sub(
        r'static isExpire\([^)]*\) \{[\s\S]*?\}',
        'static isExpire(e) { return false; }',
        content
    )
    print('成功修改 isExpire 函数')
    
    # 3. 修改isPay函数
    content = re.sub(
        r'static isPay\([^)]*\) \{[\s\S]*?return[\s\S]*?\}',
        'static isPay(e) { return true; }',
        content
    )
    print('成功修改 isPay 函数')
    
    # 4. 修改getUser函数
    mock_user = '''static getUser() { 
        return { 
            id: "cracked", 
            email: "premium@example.com", 
            username: "premium_user", 
            expireTime: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000).getTime(),
            isPremium: true,
            license: "premium"
        };
    }'''
    content = re.sub(
        r'static getUser\(\) \{[\s\S]*?\}',
        mock_user,
        content
    )
    print('成功修改 getUser 函数')
    
    # 5. 修改API请求地址
    content = re.sub(
        r'(https?:\/\/|[\'\"](https?:\/\/))database-client\.com\/api\/',
        r'\1localhost:1234/api/',
        content
    )
    content = re.sub(
        r'(https?:\/\/|[\'\"](https?:\/\/))database-client\.com\/#\/console\/',
        r'\1localhost:1234/#/console/',
        content
    )
    
    # 6. 修改验证相关函数
    for func_name in ['checkLicense', 'verifyLicense', 'activateLicense']:
        content = re.sub(
            rf'async {func_name}\([^)]*\)\s*\{{[\s\S]*?\}}',
            f'async {func_name}() {{ return true; }}',
            content
        )
    
    # 保存修改
    with open(extension_js_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('成功保存修改后的extension.js文件')

def modify_webview_assets(assets_dir):
    """修改webview中的资源文件"""
    if not os.path.exists(assets_dir):
        print(f'目录不存在: {assets_dir}')
        return
        
    priority_files = [
        'connect-BtFhhlKZ.js',
        'app-rfvkh6uB.js',
        'Result-LfwnutEA.js',
        'Main-CaCXinLR.js',
        'coreStore-m1eBg2Tl.js',
        'Plan-BHeFVyRe.js'
    ]
    
    # 获取所有JS文件
    all_js_files = [f for f in os.listdir(assets_dir) 
                    if f.endswith('.js') and not f.endswith('.bak')]
    print(f'找到 {len(all_js_files)} 个JS文件')
    
    # 合并文件列表并去重
    files_to_process = list(set(priority_files + all_js_files))
    
    for filename in files_to_process:
        file_path = os.path.join(assets_dir, filename)
        if not os.path.exists(file_path):
            print(f'文件不存在: {filename}')
            continue
            
        try:
            print(f'正在修改 {filename}...')
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 创建备份
            backup_file(file_path)
            
            # 1. 替换isPay相关检查
            content = re.sub(r'(!|\!)([a-zA-Z0-9_]+)\.isPay', 'false', content)
            content = re.sub(r'([a-zA-Z0-9_]+)\.isPay', 'true', content)
            content = re.sub(r'C\(t\)\.isPay', 'true', content)
            content = re.sub(r'W\(a\)\.isPay', 'true', content)
            
            # 2. 替换hidden属性
            for pattern in [
                r'hidden:!([a-zA-Z0-9_]+)\.isPay',
                r'hidden:([a-zA-Z0-9_]+)\.isPay',
                r'hidden:!C\(t\)\.isPay',
                r'hidden:C\(t\)\.isPay',
                r'hidden:!d\.value',
                r'hidden:!f\.value',
                r'hidden:!a\.value'
            ]:
                content = re.sub(pattern, 'hidden:true', content)
            
            # 3. 处理连接限制文本
            content = content.replace('Database 5/3', 'Database ∞/∞')
            content = content.replace('Other 3/3', 'Other ∞/∞')
            content = content.replace('连接限制: Database 5/3, Other 3/3', '连接无限制')
            
            # 4. 处理Premium Only标签
            content = re.sub(r'value:(["\'])Premium Only\1', r'value:\1\1', content)
            content = re.sub(r'value=(["\'])Premium Only\1', r'value=\1\1', content)
            
            # 5. 特别处理connect-BtFhhlKZ.js
            if filename == 'connect-BtFhhlKZ.js':
                content = re.sub(
                    r'\{"class":"text-base green mt-1","value":"Premium Only",',
                    '{"class":"text-base green mt-1","value":"", "hidden":true,',
                    content
                )
                content = re.sub(
                    r'innerHTML:t\.\$t\(`pay\.connectNotice`\)',
                    'innerHTML:""',
                    content
                )
                for pattern in [r'disabled:!f\.value', r'disabled:!d\.value', r'disabled:!a\.value']:
                    content = re.sub(pattern, 'disabled:false', content)
            
            # 6. 特别处理app-rfvkh6uB.js
            if filename == 'app-rfvkh6uB.js':
                content = re.sub(
                    r'\{"value":"Premium Only",',
                    '{"value":"", "hidden":true,',
                    content
                )
            
            # 7. 移除许可限制提示
            for text in ['闭源扩展，完整功能需要Premium许可', 'Premium许可将移除此徽章', '需要Premium']:
                content = content.replace(text, '')
            
            # 8. 修改API请求URL
            content = re.sub(
                r'(https?:\/\/|[\'\"](https?:\/\/))database-client\.com\/api\/',
                r'\1localhost:1234/api/',
                content
            )
            
            # 9. 特别处理coreStore-m1eBg2Tl.js
            if filename == 'coreStore-m1eBg2Tl.js':
                content = re.sub(
                    r'isPay\s*\([^)]*\)\s*\{[^}]*\}',
                    'isPay(){return true}',
                    content
                )
                content = re.sub(
                    r'status\s*:\s*{\s*code\s*:\s*[0-9]',
                    'status:{code:0',
                    content
                )
            
            # 10. 特别处理Plan-BHeFVyRe.js
            if filename == 'Plan-BHeFVyRe.js':
                content = re.sub(r'I\.isPay', 'true', content)
            
            # 保存修改
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'成功修改 {filename}')
            
        except Exception as e:
            print(f'修改 {filename} 时出错: {str(e)}')

def modify_package_json(package_json_path):
    """修改package.json文件"""
    if not os.path.exists(package_json_path):
        return
        
    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 创建备份
        backup_file(package_json_path)
        
        # 修改pricing字段
        content = re.sub(r'"pricing"\s*:\s*"Trial"', '"pricing": "Free"', content)
        
        with open(package_json_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('成功修改 package.json 文件')
    except Exception as e:
        print(f'修改 package.json 时出错: {str(e)}')

def create_mock_api(extension_dir):
    """创建模拟API响应文件"""
    try:
        mock_api_dir = os.path.join(extension_dir, 'mock_api')
        os.makedirs(mock_api_dir, exist_ok=True)
        
        mock_data = {
            "code": 0,
            "data": {
                "id": "cracked",
                "email": "premium@example.com",
                "username": "premium_user",
                "expireTime": 4102444800000,  # 2100年
                "isPremium": True,
                "license": "premium"
            },
            "message": "success"
        }
        
        mock_response_path = os.path.join(mock_api_dir, 'mock_license_response.json')
        with open(mock_response_path, 'w', encoding='utf-8') as f:
            json.dump(mock_data, f, indent=2, ensure_ascii=False)
        print('创建了模拟验证响应文件')
    except Exception as e:
        print(f'创建模拟响应文件时出错: {str(e)}')

def main():
    """主函数"""
    try:
        # 获取扩展目录路径
        extension_dir = os.path.dirname(os.path.abspath(__file__))
        extension_js_path = os.path.join(extension_dir, 'out', 'extension.js')
        
        print('开始修改文件以移除付费限制...')
        
        # 1. 修改extension.js
        modify_extension_js(extension_js_path)
        
        # 2. 修改webview资源文件
        webview_assets_dir = os.path.join(extension_dir, 'out', 'webview', 'assets')
        modify_webview_assets(webview_assets_dir)
        
        # 3. 修改package.json
        package_json_path = os.path.join(extension_dir, 'package.json')
        modify_package_json(package_json_path)
        
        # 4. 创建模拟API响应
        create_mock_api(extension_dir)
        
        print('\n所有修改已完成，请重启VSCode以使更改生效。')
        print('提示: 如果重启后功能仍受限，请在VSCode中按F1，然后执行 "Developer: Reload Window" 命令，或完全关闭VSCode后重新打开。')
        print('注意: 如果使用后仍然出现Premium Only，可能需要在网络设置中断开网络连接后再使用VSCode，或者通过hosts文件将database-client.com指向127.0.0.1')
        
    except Exception as e:
        print(f'修改过程中出错: {str(e)}')

if __name__ == '__main__':
    main() 