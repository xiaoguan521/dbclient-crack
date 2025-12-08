package main

import (
	"bufio"
	"flag"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"
)

// --- 配置 ---
const (
	TargetExtensionName = "cweijan.vscode-"
	Marker              = "/* PATCHED_BY_CLI */"
)

const MockUserData = `{
	id: "cracked_by_cli",
	email: "vip@cracked.com",
	username: "VIP_User",
	expireTime: 4102444800000,
	isPremium: true,
	license: "unlimited"
} ` + Marker

// --- 日志工具 ---
func logInfo(format string, a ...interface{}) {
	t := time.Now().Format("15:04:05")
	fmt.Printf("[%s] %s\n", t, fmt.Sprintf(format, a...))
}

func logError(format string, a ...interface{}) {
	t := time.Now().Format("15:04:05")
	fmt.Printf("[%s] ERROR: %s\n", t, fmt.Sprintf(format, a...))
}

// --- 核心逻辑 ---

func findExtensionDir(customPath string) (string, error) {
	if customPath != "" {
		return customPath, nil
	}
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	searchPaths := []string{}
	if runtime.GOOS == "windows" {
		searchPaths = append(searchPaths, filepath.Join(homeDir, ".vscode", "extensions"))
	} else {
		searchPaths = append(searchPaths, filepath.Join(homeDir, ".vscode", "extensions"))
		searchPaths = append(searchPaths, filepath.Join(homeDir, ".vscode-server", "extensions"))
	}

	for _, basePath := range searchPaths {
		entries, err := os.ReadDir(basePath)
		if err != nil {
			continue
		}
		for _, entry := range entries {
			if entry.IsDir() && strings.HasPrefix(entry.Name(), TargetExtensionName) {
				return filepath.Join(basePath, entry.Name()), nil
			}
		}
	}
	// 尝试当前目录
	if _, err := os.Stat("package.json"); err == nil {
		cwd, _ := os.Getwd()
		return cwd, nil
	}
	return "", fmt.Errorf("未自动找到插件目录，请使用 -path 参数指定")
}

func backupFile(path string) {
	bakPath := path + ".bak"
	if _, err := os.Stat(bakPath); os.IsNotExist(err) {
		input, err := os.ReadFile(path)
		if err == nil {
			os.WriteFile(bakPath, input, 0644)
		}
	}
}

// 简单的原子写入模拟
func saveFile(path string, content string) error {
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, []byte(content), 0644); err != nil {
		return err
	}
	// Windows 上 Rename 可能会失败如果目标存在，先删除
	os.Remove(path)
	return os.Rename(tmp, path)
}

type PatchRule struct {
	Pattern     string
	Replacement string
	Name        string
}

func applyPatch(dir string, force bool) {
	// 1. 处理 extension.js
	extJs := filepath.Join(dir, "out", "extension.js")
	if content, err := os.ReadFile(extJs); err == nil {
		strContent := string(content)
		if strings.Contains(strContent, Marker) && !force {
			logInfo("跳过 extension.js (已修改)")
		} else {
			backupFile(extJs)
			rules := []PatchRule{
				{`(?s)static\s+isPremium\s*\(\s*\)\s*\{.*?\}`, `static isPremium() { return true; }`, "isPremium"},
				{`(?s)static\s+isPay\s*\([^)]*\)\s*\{.*?\}`, `static isPay(e) { return true; }`, "isPay"},
				{`(?s)static\s+getUser\s*\(\s*\)\s*\{.*?\}`, fmt.Sprintf(`static getUser() { return %s; }`, MockUserData), "getUser"},
				{`(?s)async\s+checkLicense\s*\([^)]*\)\s*\{.*?\}`, `async checkLicense() { return true; }`, "checkLicense"},
			}

			modified := strContent
			count := 0
			for _, r := range rules {
				re := regexp.MustCompile(r.Pattern)
				if re.MatchString(modified) {
					modified = re.ReplaceAllString(modified, r.Replacement)
					count++
				}
			}

			if count > 0 {
				if err := saveFile(extJs, modified); err == nil {
					logInfo("成功修补 extension.js (%d 处修改)", count)
				}
			}
		}
	}

	// 2. 处理前端资源
	assetsDir := filepath.Join(dir, "out", "webview", "assets")
	frontendRules := []PatchRule{
		{`(!|\!)([a-zA-Z0-9_]+)\.isPay`, `false`, "Force !isPay"},
		{`([a-zA-Z0-9_]+)\.isPay`, `true`, "Force isPay"},
		{`Database 5/3`, `Database ∞`, "DB Limit"},
		{`Other 3/3`, `Other ∞`, "Other Limit"},
		{`value:["']Premium Only["']`, `value:"",hidden:true`, "Hide Badge"},
	}

	filepath.WalkDir(assetsDir, func(path string, d fs.DirEntry, err error) error {
		if err == nil && !d.IsDir() && strings.HasSuffix(d.Name(), ".js") && !strings.HasSuffix(d.Name(), ".bak") {
			content, _ := os.ReadFile(path)
			strContent := string(content)
			modified := strContent
			changed := false

			for _, r := range frontendRules {
				re := regexp.MustCompile(r.Pattern)
				if re.MatchString(modified) {
					modified = re.ReplaceAllString(modified, r.Replacement)
					changed = true
				}
			}

			if changed {
				backupFile(path)
				if err := saveFile(path, modified); err == nil {
					logInfo("修补前端文件: %s", d.Name())
				}
			}
		}
		return nil
	})

	// 3. Package.json
	pkgPath := filepath.Join(dir, "package.json")
	if content, err := os.ReadFile(pkgPath); err == nil {
		strContent := string(content)
		if strings.Contains(strContent, `"pricing": "Trial"`) {
			backupFile(pkgPath)
			strContent = strings.Replace(strContent, `"pricing": "Trial"`, `"pricing": "Free"`, 1)
			saveFile(pkgPath, strContent)
			logInfo("已修改 package.json pricing -> Free")
		}
	}
}

func restore(dir string) {
	filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err == nil && strings.HasSuffix(d.Name(), ".bak") {
			orig := strings.TrimSuffix(path, ".bak")
			os.Rename(path, orig)
			logInfo("还原: %s", filepath.Base(orig))
		}
		return nil
	})
}

func main() {
	// 命令行参数
	pathFlag := flag.String("path", "", "指定插件目录")
	restoreFlag := flag.Bool("restore", false, "还原备份")
	forceFlag := flag.Bool("force", false, "强制重新破解")
	flag.Parse()

	fmt.Println("-------------------------------------------")
	fmt.Println("   Database Client 解锁工具 (Go CLI版)    ")
	fmt.Println("-------------------------------------------")

	targetDir, err := findExtensionDir(*pathFlag)
	if err != nil {
		logError("%v", err)
		pause()
		return
	}

	logInfo("目标目录: %s", targetDir)

	if *restoreFlag {
		logInfo("开始还原...")
		restore(targetDir)
	} else {
		logInfo("开始破解...")
		applyPatch(targetDir, *forceFlag)
	}

	fmt.Println("-------------------------------------------")
	logInfo("操作完成！请重启 VSCode (F1 -> Reload Window)")
	pause()
}

func pause() {
	fmt.Print("\n按回车键退出...")
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}
