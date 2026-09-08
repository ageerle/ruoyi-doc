---
outline: deep
---

# AI-Assisted Programming {#ai编程}

::: info RuoYi AI documentation
This guide covers [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai). Help improve it by reporting problems in an [issue](https://gitee.com/ageerle/ruoyi-ai/issues).
:::

This tutorial uses Claude Code to illustrate AI-assisted development. The beginner section covers installation, configuration, and daily operations. The advanced section introduces MCP integrations and Skills for specialized tasks.

The examples follow the conventions in this project's Chinese tutorial. Check prompts and available settings in your installed CLI or IDE version; shortcuts, permission behavior, and configuration fields can vary. Original sample prompts and code are retained where they refer to the same demonstration data.

## Getting started {#入门篇}

### Prerequisites {#前提条件}

For **VS Code**, the source tutorial recommends version 1.98.0 or later and Git for Windows on Windows. For **JetBrains IDEs**, such as IntelliJ IDEA, PyCharm, or WebStorm, it recommends version 2025.1 or later. The npm-based CLI examples below use Node.js 18 or later; follow the actual requirements of the version you install.

### Install Claude Code {#claude-code-安装}

#### 1. VS Code extension {#_1-vs-code-插件安装}

**From the extension marketplace:**

1. Open Extensions with Ctrl+Shift+X.
2. Search for Claude Code.
3. Install the official Anthropic extension.

**From the command line:**

```bash
npm install -g @anthropic-ai/claude-code
```

The source tutorial uses this CLI path to initialize the VS Code integration. Follow any installation prompts shown by your version.

#### 2. JetBrains integration {#_2-jetbrains-ides-插件安装}

1. Install the command-line tool:

```bash
npm install -g @anthropic-ai/claude-code
```

2. Open the IDE's Settings → Plugins, search for Claude Code, install the official plugin, and restart the IDE. The source tutorial shows the Beta-labeled plugin.
3. Verify installation:

```bash
claude-code --version
```

### 1. Initialize project context {#_1-初始化项目分析}

Run `/init` to analyze the project structure, identify its technology stack, and create a `CLAUDE.md` file describing project conventions. Review that file so it accurately reflects the repository.

### 2. Switch permission modes {#_2-权限模式切换}

The tutorial uses Shift+Tab to cycle through these modes:

| Mode | Behavior | Indicator |
| --- | --- | --- |
| Normal | Uses the configured permission checks and prompts | No special indicator |
| Auto-Accept | Accepts edits without individual edit confirmations | `⏵⏵ accept edits on` |
| Plan | Analyzes and plans without editing project files | `⏸ plan mode on` |

#### When to use Plan Mode {#plan-mode-使用场景}

Use it when a change spans several files, the approach is still undecided, or the work benefits from reviewing the plan before edits.

#### Choose a mode at startup {#启动时指定模式}

```bash
claude --permission-mode plan
```

### 3. Reference files and directories {#_3-引用文件-目录-引用}

Type `@` followed by a path, using completion to select the intended file or directory. This supplies focused context for a particular module. Completion behavior can differ between terminals and IDE integrations.

### 4. Export a conversation {#_4-导出会话}

Use `/export` to save a conversation as Markdown for archiving, reviewing a complex investigation, or sharing with your team. Follow the current terminal's export prompts.

### 5. Request deeper reasoning {#_5-增强思考-ultrathink}

The source tutorial uses an `ultrathink:` prefix for architecture, difficult debugging, and refactoring tradeoffs. Its effect depends on the installed version and configuration; do not assume the text alone guarantees a particular reasoning budget.

### 6. Paste screenshots {#_6-粘贴截图}

Paste a screenshot into the supported input area, using Ctrl+V where supported, and describe the issue. For example:

> [Screenshot]
> The button's spacing is incorrect. Please fix it to match the adjacent controls.

### 7. Correct direction early {#_7-尽早纠正方向}

Press Esc to interrupt when the assistant takes the wrong direction, then give a specific correction. There is no need to wait for a long response to finish.

### 8. Navigate previous prompts {#_8-历史提示词导航}

Use the Up and Down arrow keys to navigate prior input, repeat related work, or recall a previous command.

### 9. Run a shell command {#_9-快捷执行控制台命令}

Prefix a command with `!` to run it and bring the output into the conversation. For example, `!npm --version` checks the installed npm version.

### 10. Search prompt history {#_10-搜索历史提示词}

Use Ctrl+R and a keyword to find a previous prompt, particularly a long command or detailed request.

### 11. Skip permission checks with care {#_11-yolo-模式-谨慎使用}

The source tutorial includes this startup option:

```bash
claude --dangerously-skip-permissions
```

It bypasses permission confirmations and can execute commands that change or delete files. Use it only in an environment where the task and executable content are fully trusted and the consequences are understood.

---

### Appendix: configuration examples {#附录-配置参考}

#### Configuration locations {#配置文件位置}

```bash
# Windows
%USERPROFILE%\.claude.json

# macOS/Linux
~/.claude.json
```

#### .claude.json {#claude-json-配置详解}

The tutorial's `.claude.json` example contains basic setup information and MCP server definitions. Internal fields can differ by version; prefer the installed tool's supported configuration flow.

##### Complete example {#完整配置示例}

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

##### Fields in the example {#字段说明}

| Field | Meaning | Example value |
| --- | --- | --- |
| `hasCompletedOnboarding` | Whether onboarding is complete | `true` |
| `acceptedTos` | Terms acceptance state | `true` |
| `autoUpdates` | Automatic updates | `false` |
| `installMethod` | Installation method | `npm` |
| `userID` | User identifier | Generated by the tool |
| `mcpServers` | MCP server definitions | `{}` |

#### settings.json {#settings-json-配置详解}

The project settings example configures environment variables and project-specific behavior.

##### Location {#位置}

```bash
# 项目根目录
./settings.json
```

##### Complete example {#完整配置示例-1}

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

##### Environment fields {#字段说明-1}

| Field | Meaning | Required by this example | Example |
| --- | --- | --- | --- |
| `ANTHROPIC_BASE_URL` | API base URL | No | `https://api.anthropic.com` |
| `ANTHROPIC_AUTH_TOKEN` | API authentication token | Yes | `sk-ant-xxxxx` |
| `ANTHROPIC_MODEL` | Default model | No | `claude-opus-4-6` |
| `ANTHROPIC_SMALL_FAST_MODEL` | Small, fast model | No | `claude-haiku-4-5-20251001` |
| `NODE_ENV` | Runtime environment | No | `development` |

#### Configuration steps {#配置步骤}

##### Step 1: create .claude.json {#步骤-1-创建-claude-json}

```bash
# 1. 进入用户主目录
cd ~

# 2. 创建 .claude.json 文件（如果不存在）
# 复制上面的完整配置示例

# 3. 替换其中的 sk-xxx 为你的实际 API Key
```

##### Step 2: optionally create settings.json {#步骤-2-创建-settings-json-可选}

```bash
# 1. 进入项目根目录
cd /path/to/your/project

# 2. 创建 settings.json 文件
# 复制上面的完整配置示例

# 3. 配置项目特定的环境变量
```

##### Step 3: verify configuration {#步骤-3-验证配置}

```bash
# 查看配置是否正确
cat ~/.claude.json

# 在 Claude Code 中验证
!echo $ANTHROPIC_AUTH_TOKEN
```

#### Protect credentials {#安全建议}

Keep API keys out of Git and public conversations, and rotate them as needed. The tutorial illustrates environment variables:

```bash
# 更安全的方式：使用环境变量
export ANTHROPIC_AUTH_TOKEN="sk-ant-xxxxx"
```

Exclude sensitive local configuration from version control:

```
# 不要提交敏感配置
settings.json
.env
.env.local
```

Limit local file permissions on Linux/macOS:

```bash
# Linux/macOS 设置文件权限
chmod 600 ~/.claude.json
```

## Advanced usage {#进阶篇}

The following sections cover MCP integrations and specialized Skills for developers already comfortable with the basic workflow.

---

### Chapter 1: MCP integrations {#第一章-mcp-模型上下文协议-深度应用}

#### 1.1 Configure and manage MCP servers {#_1-1-mcp-服务配置与管理}

##### What is MCP? {#什么是-mcp}

Model Context Protocol connects the assistant to external tools and data sources through MCP servers.

##### Configuration location {#配置文件位置-1}

The source tutorial uses the [ModelScope MCP directory](https://www.modelscope.cn/mcp) to find services.

```bash
# Windows
%USERPROFILE%\.claude.json
```

##### Basic configuration {#基础配置示例}

```json
{
  "mcpServers": {
    "bing-search": {
      "command": "npx",
      "args": ["-y", "bing-cn-mcp"]
    }
  }
}
```

#### 1.2 Example MCP services {#_1-2-常用-mcp-服务配置}

##### Bing search in Chinese {#必应搜索-中文}

```json
{
  "mcpServers": {
    "bing-search": {
      "command": "npx",
      "args": ["-y", "bing-cn-mcp"]
    }
  }
}
```

Example request:

```
使用必应搜索最新的 AI 新闻
```

Search results can include titles, links, and summaries. Further page retrieval, pagination, and filters depend on the functions exposed by the selected server.

##### Several servers {#多服务配置}

```json
{
  "mcpServers": {
    "bing-search": {
      "command": "npx",
      "args": ["-y", "bing-cn-mcp"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelscope/mcp-filesystem"]
    },
    "postgresql": {
      "command": "npx",
      "args": ["-y", "@modelscope/mcp-postgresql"]
    }
  }
}
```

#### 1.3 Inspect available tools {#_1-3-查询可用-mcp-工具}

Ask in the conversation:

```
你有哪些 MCP 工具？
```

Check the configured servers and the functions actually available to the current session.

#### 1.4 Practical uses {#_1-4-mcp-的实战应用场景}

| Task | Example MCP server | Use |
| --- | --- | --- |
| Current information | `bing-search` | Search news, prices, or weather |
| Database work | `postgresql` | Query or update according to the server's available tools and database permissions |
| File access | `filesystem` | Access explicitly configured directories |
| API integration | `custom-api` | Connect internal business APIs |

#### 1.5 Configuration practices {#_1-5-mcp-配置最佳实践}

Pass credentials through supported environment configuration and limit each server's access. Configure only the services needed, then observe invocation latency and success rates. Keep server versions maintained and retain appropriate logs for important calls.

---

### Chapter 2: Skills {#第二章-skills-深度应用}

#### 2.1 Overview {#_2-1-skills-系统概述}

Skills provide instructions and supporting tools for specialized file types or tasks. The source tutorial demonstrates three skill packages; these are examples, not capabilities automatically bundled with every installation.

##### Three example skills {#三大核心-skills}

| Skill | Tasks | Example dependencies |
| --- | --- | --- |
| `ai-tutor` | Technical explanations and video transcription | Python, FFmpeg |
| `pdf` | PDF creation, editing, forms, and extraction | LibreOffice, ReportLab |
| `xlsx` | Spreadsheets, analysis, and charts | LibreOffice, openpyxl, pandas |

#### 2.2 Installation and dependencies {#_2-2-安装与环境配置}

##### Step 1: download the skills {#步骤-1-下载-skills}

```bash
# 克隆 Skills 仓库
git clone https://github.com/anthropics/skills.git

# 或访问在线浏览
https://github.com/anthropics/skills/tree/main/skills
```

##### Step 2: copy them into the Claude directory {#步骤-2-复制到-claude-目录}

```bash
# Windows
复制到 %USERPROFILE%\.claude\skills\

# macOS/Linux
复制到 ~/.claude/skills/
```

##### Step 3: install dependencies {#步骤-3-安装依赖环境}

Python:

```bash
# 安装最新 Python（版本 3.10+）
# Windows: https://www.python.org/downloads/
# macOS: brew install python@3.11
# Linux: apt-get install python3.11

# 验证安装
python --version
```

LibreOffice:

```bash
# Windows: 下载完整包
https://zh-cn.libreoffice.org/download/libreoffice/

# macOS
brew install libreoffice

# Linux
apt-get install libreoffice
```

Python packages:

```bash
pip install reportlab -q
pip install openpyxl -q
pip install pandas -q
pip install pillow -q
pip install python-pptx -q
```

Verify installation:

```bash
# 在 Claude Code 中查询可用 Skills
你有哪些 Skills？
```

#### 2.3 ai-tutor {#_2-3-ai-tutor-skill-详解}

##### Examples {#功能与应用}

Explain a technical concept:

```
ultrathink: 请用 ai-tutor 给我讲解什么是微服务架构，
包括核心概念、优缺点和应用场景
```

Transcribe and analyze a video:

```
帮我转录这个视频文件，并总结核心要点
@/path/to/video.mp4
```

##### Usage tips {#最佳实践}

Supply relevant reference material and request the depth you need. The source examples use `ultrathink:` where supported. Divide long videos into sections for easier processing and review.

#### 2.4 PDF {#_2-4-pdf-skill-详解}

##### Main tasks {#核心功能}

Create a PDF:

```
帮我创建一个项目总结报告 PDF，
包含：项目概述、技术方案、进度统计、团队成员信息
```

Fill a form:

```
帮我填充这个 PDF 表单：
@表单模板.pdf

数据内容：
- 姓名：张三
- 日期：2026-03-04
- 签名：已确认
```

Extract text and tables:

```
请提取这个 PDF 中的所有表格数据，
转换为 CSV 格式
@/path/to/document.pdf
```

Merge and split documents:

```
合并这些 PDF 文件：
@file1.pdf
@file2.pdf
@file3.pdf

输出为：merged_document.pdf
```

##### Advanced examples {#pdf-高级用法}

Batch processing:

```bash
# 处理目录下所有 PDF
帮我批量提取 ./pdf_folder 中所有 PDF 的文本内容
```

Conditional conversion:

```
将这个 PDF 转换为图片，
仅保留第 1-5 页
@source.pdf
```

#### 2.5 XLSX {#_2-5-xlsx-skill-详解}

##### Main tasks {#核心功能-1}

Create structured data:

```
创建一个产品销售统计表，
包含：产品名称、销售数量、销售额、利润率、同比增长
示例数据：5条产品记录
```

Analyze data and create charts:

```
分析这个 Excel 文件，
生成销售趋势图表和关键指标总结
@sales_data.xlsx
```

Add formulas and calculations:

```
创建财务预算表，
包含收入、成本、利润等项目，
自动计算小计和总计
```

Build pivot tables and statistics:

```
基于这个数据文件，
按地区和产品类别生成销售汇总表
@detailed_sales.xlsx
```

##### Spreadsheet practices {#xlsx-最佳实践}

Use clear column headings, appropriate number formats or conditional formatting, and data-validation rules to reduce input errors.
