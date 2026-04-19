
# Claude Code 使用教程 - 入门篇

## 前提条件

**VS Code**
- 最新版本（推荐 1.98.0 或更高）
- Git for Windows（Windows 用户必需）

**JetBrains IDEs**（IntelliJ IDEA、PyCharm、WebStorm 等）
- 最新版本建议(推荐 2025.1 及以上)

- Node.js 18+（运行 Claude Code 命令行工具）

## Claude Code 安装

### 1. VS Code 插件安装

**方法 A：通过扩展市场（推荐）**
1. 打开 VS Code 扩展面板（Ctrl+Shift+X）
2. 搜索"Claude Code"
3. 安装官方 Anthropic 插件

**方法 B：命令行安装**
```bash
npm install -g @anthropic-ai/claude-code
```
VS Code 扩展将自动安装。

### 2. JetBrains IDEs 插件安装

1. 先安装 Claude Code 命令行工具：
```bash
npm install -g @anthropic-ai/claude-code
```

2. 在 IDE 中安装插件：
   - 打开 IDE 设置 → 插件（Plugins）
   - 搜索"Claude Code"
   - 安装官方插件（标记为 Beta）
   - 重启 IDE

3. 验证安装：
```bash
claude-code --version
```

## 1. 初始化项目分析
- `/init` — 启动项目分析，自动执行：
    - 分析项目结构
    - 识别使用的技术栈
    - 创建 `CLAUDE.md` 文件记录项目约定

## 2. 权限模式切换
Claude Code 提供三种权限模式，可通过 **Shift+Tab** 循环切换：

| 模式 | 说明 | 底部指示 |
|------|------|----------|
| **Normal Mode** | 默认模式，每次操作需确认 | 无特殊标记 |
| **Auto-Accept Mode** | 自动接受编辑（无需确认） | 显示 `⏵⏵ accept edits on` |
| **Plan Mode** | 只读模式，仅分析不修改文件 | 显示 `⏸ plan mode on` |

### Plan Mode 使用场景
- 跨多文件改动
- 方案尚未确定时
- 对安全性要求高

### 启动时指定模式
```bash
claude --permission-mode plan
```

## 3. 引用文件/目录（@ 引用）
- **命令**：`@` 后跟文件或目录路径
- **作用**：快速将指定文件/目录拉入上下文，让 Claude 精准定位
- **适用场景**：需要对特定模块操作，避免全仓库搜索
- **用法**：输入 `@` 后使用补全选择路径（不同终端/IDE 体验略有差异）

## 4. 导出会话
- **命令**：`/export`
- **作用**：将整个会话导出为 Markdown 格式
- **适用场景**：完成复杂排障或重构后，需要归档、复盘、团队分享
- **注意**：导出内容以当前终端的提示为准

## 5. 增强思考（ultrathink）
- **触发方式**：在提示词前加上 `ultrathink:` 前缀
- **作用**：触发更深的推理预算（具体实现受版本/配置影响）
- **适用场景**：
    - 架构设计
    - 复杂排障
    - 需要多角度权衡的重构

## 6. 粘贴截图
- **方式**：在 Claude Code 输入框中按 **Ctrl+V**
- **作用**：快速截取屏幕内容并粘贴到对话中
- **使用建议**：
    - 粘贴后可添加文字说明
    > [粘贴截图]
    > 这个按钮的样式有问题，请帮我修复

## 7. 尽早纠正方向
- **快捷键**：**Esc**
- **作用**：发现 Claude 走错方向时，立即中断并纠正
- **场景**：避免等待完整响应，及时调整思路

## 8. 历史提示词导航
- **快捷键**：**方向键上/下**
- **作用**：快速切换之前输入过的提示词
- **场景**：快速重复类似操作或查看历史命令

## 9. 快捷执行控制台命令
- **前缀**：`!` 前缀
- **作用**：在对话中执行控制台命令，将输出结果带回对话
- **示例**：`!npm --version`（快速执行并显示结果）

## 10. 搜索历史提示词
- **快捷键**：**Ctrl+R**
- **作用**：输入关键词搜索之前的历史提示词
- **场景**：快速找到之前的长命令或复杂提示

## 11. YOLO 模式（谨慎使用）
- **启动方式**：
  ```bash
  claude --dangerously-skip-permissions
  ```
- **说明**：跳过权限确认，直接执行脚本命令
- **警告**：⚠️ 仅在完全信任脚本内容时使用，可能导致意外文件修改或删除

---

## 附录：配置参考

### 配置文件位置

```bash
# Windows
%USERPROFILE%\.claude.json

# macOS/Linux
~/.claude.json
```

### .claude.json 配置详解

这是 Claude Code 的主配置文件，用于管理基本设置和 MCP 服务。

#### 完整配置示例

```json
{
  "hasCompletedOnboarding": true,
  "acceptedTos": true,
  "autoUpdates": false,
  "installMethod": "npm",
  "userID": "00000000-guest-user-bypass-config-template-00000000",
  "firstStartTime": "2025-01-01T00:00:00.000Z",
  "sonnet45MigrationComplete": true,
  "opus45MigrationComplete": true,
  "opusProMigrationComplete": true,
  "thinkingMigrationComplete": true,
  "cachedChromeExtensionInstalled": false,
  "mcpServers": {
    "bing-search": {
      "command": "npx",
      "args": ["-y", "bing-cn-mcp"]
    }
  }
}
```

#### 字段说明

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `hasCompletedOnboarding` | 是否完成初始化向导 | true |
| `acceptedTos` | 是否接受服务条款 | true |
| `autoUpdates` | 是否自动更新 | false |
| `installMethod` | 安装方式 | npm |
| `userID` | 用户标识 | 自动生成 |
| `mcpServers` | MCP 服务配置 | {} |

### settings.json 配置详解

这是项目级别的配置文件，用于管理环境变量和项目特定设置。

#### 位置
```bash
# 项目根目录
./settings.json
```

#### 完整配置示例

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-your-token-here",
    "ANTHROPIC_MODEL": "claude-opus-4-6",
    "ANTHROPIC_SMALL_FAST_MODEL": "claude-haiku-4-5-20251001",
    "NODE_ENV": "development"
  }
}
```

#### 字段说明

| 字段 | 说明 | 必需 | 示例 |
|------|------|------|------|
| `ANTHROPIC_BASE_URL` | API 基础 URL | 否 | https://api.anthropic.com |
| `ANTHROPIC_AUTH_TOKEN` | API 认证密钥 | 是 | sk-ant-xxxxx |
| `ANTHROPIC_MODEL` | 默认 Claude 模型 | 否 | claude-opus-4-6 |
| `ANTHROPIC_SMALL_FAST_MODEL` | 小型快速模型 | 否 | claude-haiku-4-5-20251001 |
| `NODE_ENV` | 运行环境 | 否 | development |

### 配置步骤

#### 步骤 1：创建 .claude.json

```bash
# 1. 进入用户主目录
cd ~

# 2. 创建 .claude.json 文件（如果不存在）
# 复制上面的完整配置示例

# 3. 替换其中的 sk-xxx 为你的实际 API Key
```

#### 步骤 2：创建 settings.json（可选）

```bash
# 1. 进入项目根目录
cd /path/to/your/project

# 2. 创建 settings.json 文件
# 复制上面的完整配置示例

# 3. 配置项目特定的环境变量
```

#### 步骤 3：验证配置

```bash
# 查看配置是否正确
cat ~/.claude.json

# 在 Claude Code 中验证
!echo $ANTHROPIC_AUTH_TOKEN
```

### 安全建议

⚠️ **重要安全提示**

1. **保护 API Key**
   - 不要将 API Key 提交到 Git 仓库
   - 不要在公开的地方分享你的 API Key
   - 定期轮换 API Key

2. **使用环境变量**
   ```bash
   # 更安全的方式：使用环境变量
   export ANTHROPIC_AUTH_TOKEN="sk-ant-xxxxx"
   ```

3. **.gitignore 配置**
   ```
   # 不要提交敏感配置
   settings.json
   .env
   .env.local
   ```

4. **文件权限**
   ```bash
   # Linux/macOS 设置文件权限
   chmod 600 ~/.claude.json
   ```

---

以上是入门篇的全部内容。如有其他需求，欢迎补充说明。更多高级用法请参考《Claude Code 使用教程 - 进阶篇》。