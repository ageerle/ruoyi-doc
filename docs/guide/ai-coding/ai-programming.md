---
outline: deep
---

# AI编程

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) 的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

本教程以 Claude Code 为例，介绍如何使用 AI 辅助编程工具完成日常开发，分为入门篇与进阶篇两部分：入门篇覆盖安装配置与基础用法，进阶篇覆盖 MCP 扩展、Skills 工具等深度实践。

## 入门篇

### 前提条件

**VS Code**
- 最新版本（推荐 1.98.0 或更高）
- Git for Windows（Windows 用户必需）

**JetBrains IDEs**（IntelliJ IDEA、PyCharm、WebStorm 等）
- 最新版本建议(推荐 2025.1 及以上)

- Node.js 18+（运行 Claude Code 命令行工具）

### Claude Code 安装

#### 1. VS Code 插件安装

**方法 A：通过扩展市场（推荐）**
1. 打开 VS Code 扩展面板（Ctrl+Shift+X）
2. 搜索"Claude Code"
3. 安装官方 Anthropic 插件

**方法 B：命令行安装**
```bash
npm install -g @anthropic-ai/claude-code
```
VS Code 扩展将自动安装。

#### 2. JetBrains IDEs 插件安装

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

### 1. 初始化项目分析
- `/init` — 启动项目分析，自动执行：
    - 分析项目结构
    - 识别使用的技术栈
    - 创建 `CLAUDE.md` 文件记录项目约定

### 2. 权限模式切换
Claude Code 提供三种权限模式，可通过 **Shift+Tab** 循环切换：

| 模式 | 说明 | 底部指示 |
|------|------|----------|
| **Normal Mode** | 默认模式，每次操作需确认 | 无特殊标记 |
| **Auto-Accept Mode** | 自动接受编辑（无需确认） | 显示 `⏵⏵ accept edits on` |
| **Plan Mode** | 只读模式，仅分析不修改文件 | 显示 `⏸ plan mode on` |

#### Plan Mode 使用场景
- 跨多文件改动
- 方案尚未确定时
- 对安全性要求高

#### 启动时指定模式
```bash
claude --permission-mode plan
```

### 3. 引用文件/目录（@ 引用）
- **命令**：`@` 后跟文件或目录路径
- **作用**：快速将指定文件/目录拉入上下文，让 Claude 精准定位
- **适用场景**：需要对特定模块操作，避免全仓库搜索
- **用法**：输入 `@` 后使用补全选择路径（不同终端/IDE 体验略有差异）

### 4. 导出会话
- **命令**：`/export`
- **作用**：将整个会话导出为 Markdown 格式
- **适用场景**：完成复杂排障或重构后，需要归档、复盘、团队分享
- **注意**：导出内容以当前终端的提示为准

### 5. 增强思考（ultrathink）
- **触发方式**：在提示词前加上 `ultrathink:` 前缀
- **作用**：触发更深的推理预算（具体实现受版本/配置影响）
- **适用场景**：
    - 架构设计
    - 复杂排障
    - 需要多角度权衡的重构

### 6. 粘贴截图
- **方式**：在 Claude Code 输入框中按 **Ctrl+V**
- **作用**：快速截取屏幕内容并粘贴到对话中
- **使用建议**：
    - 粘贴后可添加文字说明
    > [粘贴截图]
    > 这个按钮的样式有问题，请帮我修复

### 7. 尽早纠正方向
- **快捷键**：**Esc**
- **作用**：发现 Claude 走错方向时，立即中断并纠正
- **场景**：避免等待完整响应，及时调整思路

### 8. 历史提示词导航
- **快捷键**：**方向键上/下**
- **作用**：快速切换之前输入过的提示词
- **场景**：快速重复类似操作或查看历史命令

### 9. 快捷执行控制台命令
- **前缀**：`!` 前缀
- **作用**：在对话中执行控制台命令，将输出结果带回对话
- **示例**：`!npm --version`（快速执行并显示结果）

### 10. 搜索历史提示词
- **快捷键**：**Ctrl+R**
- **作用**：输入关键词搜索之前的历史提示词
- **场景**：快速找到之前的长命令或复杂提示

### 11. YOLO 模式（谨慎使用）
- **启动方式**：
  ```bash
  claude --dangerously-skip-permissions
  ```
- **说明**：跳过权限确认，直接执行脚本命令
- **警告**：⚠️ 仅在完全信任脚本内容时使用，可能导致意外文件修改或删除

---

### 附录：配置参考

#### 配置文件位置

```bash
# Windows
%USERPROFILE%\.claude.json

# macOS/Linux
~/.claude.json
```

#### .claude.json 配置详解

这是 Claude Code 的主配置文件，用于管理基本设置和 MCP 服务。

##### 完整配置示例

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

##### 字段说明

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `hasCompletedOnboarding` | 是否完成初始化向导 | true |
| `acceptedTos` | 是否接受服务条款 | true |
| `autoUpdates` | 是否自动更新 | false |
| `installMethod` | 安装方式 | npm |
| `userID` | 用户标识 | 自动生成 |
| `mcpServers` | MCP 服务配置 | {} |

#### settings.json 配置详解

这是项目级别的配置文件，用于管理环境变量和项目特定设置。

##### 位置
```bash
# 项目根目录
./settings.json
```

##### 完整配置示例

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

##### 字段说明

| 字段 | 说明 | 必需 | 示例 |
|------|------|------|------|
| `ANTHROPIC_BASE_URL` | API 基础 URL | 否 | https://api.anthropic.com |
| `ANTHROPIC_AUTH_TOKEN` | API 认证密钥 | 是 | sk-ant-xxxxx |
| `ANTHROPIC_MODEL` | 默认 Claude 模型 | 否 | claude-opus-4-6 |
| `ANTHROPIC_SMALL_FAST_MODEL` | 小型快速模型 | 否 | claude-haiku-4-5-20251001 |
| `NODE_ENV` | 运行环境 | 否 | development |

#### 配置步骤

##### 步骤 1：创建 .claude.json

```bash
# 1. 进入用户主目录
cd ~

# 2. 创建 .claude.json 文件（如果不存在）
# 复制上面的完整配置示例

# 3. 替换其中的 sk-xxx 为你的实际 API Key
```

##### 步骤 2：创建 settings.json（可选）

```bash
# 1. 进入项目根目录
cd /path/to/your/project

# 2. 创建 settings.json 文件
# 复制上面的完整配置示例

# 3. 配置项目特定的环境变量
```

##### 步骤 3：验证配置

```bash
# 查看配置是否正确
cat ~/.claude.json

# 在 Claude Code 中验证
!echo $ANTHROPIC_AUTH_TOKEN
```

#### 安全建议

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

## 进阶篇

进阶篇涵盖 MCP 扩展、Skills 工具等深度实践主题，适用于已掌握基础操作的开发者。

---

### 第一章：MCP（模型上下文协议）深度应用

#### 1.1 MCP 服务配置与管理

##### 什么是 MCP？
MCP（Model Context Protocol）是扩展 Claude 功能的协议。通过配置 MCP 服务器，可以让 Claude 访问各种外部工具和数据源。

##### 配置文件位置
- 访问mcp广场：https://www.modelscope.cn/mcp

```bash
# Windows
%USERPROFILE%\.claude.json
```

##### 基础配置示例
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

#### 1.2 常用 MCP 服务配置

##### 必应搜索（中文）
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

**使用示例：**
```
使用必应搜索最新的 AI 新闻
```

**输出示例：**
- 搜索结果包含标题、链接和摘要
- 可进一步爬取网页详细内容
- 支持分页和结果过滤

##### 多服务配置
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

#### 1.3 查询可用 MCP 工具

在对话中输入：
```
你有哪些 MCP 工具？
```

Claude 将列出所有已配置的 MCP 服务和它们提供的功能。

#### 1.4 MCP 的实战应用场景

| 场景 | MCP 工具 | 用法 |
|------|---------|------|
| 实时信息查询 | bing-search | 获取最新新闻、金价、天气等 |
| 数据库操作 | postgresql | 直接查询和修改数据库 |
| 文件系统扩展 | filesystem | 访问系统特定目录 |
| API 集成 | custom-api | 连接企业内部 API |

#### 1.5 MCP 配置最佳实践

**安全性：**
- 敏感信息（API Key、密码）应通过环境变量传入，不要硬编码在配置中
- 限制 MCP 服务的访问权限

**性能：**
- 延迟加载 MCP 服务（仅配置必需的服务）
- 监控 MCP 调用的延迟和成功率

**维护：**
- 定期检查 MCP 服务更新
- 记录关键 MCP 调用的日志

---

### 第二章：Skills 深度应用

#### 2.1 Skills 系统概述

Skills 是 Claude Code 的扩展工具，用于处理特殊文件类型和复杂任务。

##### 三大核心 Skills

| Skill | 功能 | 依赖环境 |
|-------|------|---------|
| **ai-tutor** | 技术教学、概念讲解、视频转录 | Python、FFmpeg |
| **pdf** | PDF 创建、编辑、表单填充、文本提取 | LibreOffice、ReportLab |
| **xlsx** | Excel 创建、数据分析、图表生成 | LibreOffice、openpyxl、pandas |

#### 2.2 安装与环境配置

##### 步骤 1：下载 Skills
```bash
# 克隆 Skills 仓库
git clone https://github.com/anthropics/skills.git

# 或访问在线浏览
https://github.com/anthropics/skills/tree/main/skills
```

##### 步骤 2：复制到 Claude 目录
```bash
# Windows
复制到 %USERPROFILE%\.claude\skills\

# macOS/Linux
复制到 ~/.claude/skills/
```

##### 步骤 3：安装依赖环境

**Python 环境**
```bash
# 安装最新 Python（版本 3.10+）
# Windows: https://www.python.org/downloads/
# macOS: brew install python@3.11
# Linux: apt-get install python3.11

# 验证安装
python --version
```

**LibreOffice**
```bash
# Windows: 下载完整包
https://zh-cn.libreoffice.org/download/libreoffice/

# macOS
brew install libreoffice

# Linux
apt-get install libreoffice
```

**Python 依赖包**
```bash
pip install reportlab -q
pip install openpyxl -q
pip install pandas -q
pip install pillow -q
pip install python-pptx -q
```

**验证安装**
```bash
# 在 Claude Code 中查询可用 Skills
你有哪些 Skills？
```

#### 2.3 ai-tutor Skill 详解

##### 功能与应用

**技术概念讲解**
```
ultrathink: 请用 ai-tutor 给我讲解什么是微服务架构，
包括核心概念、优缺点和应用场景
```

**视频转录与分析**
```
帮我转录这个视频文件，并总结核心要点
@/path/to/video.mp4
```

##### 最佳实践

- 对复杂概念使用 `ultrathink:` 前缀获得更深入的讲解
- 结合上下文参考资料提高讲解的精准度
- 转录长视频时分段处理以提高效率

#### 2.4 PDF Skill 详解

##### 核心功能

**创建 PDF 文档**
```
帮我创建一个项目总结报告 PDF，
包含：项目概述、技术方案、进度统计、团队成员信息
```

**表单填充**
```
帮我填充这个 PDF 表单：
@表单模板.pdf

数据内容：
- 姓名：张三
- 日期：2026-03-04
- 签名：已确认
```

**文本提取与表格识别**
```
请提取这个 PDF 中的所有表格数据，
转换为 CSV 格式
@/path/to/document.pdf
```

**文档合并与分割**
```
合并这些 PDF 文件：
@file1.pdf
@file2.pdf
@file3.pdf

输出为：merged_document.pdf
```

##### PDF 高级用法

**批量处理**
```bash
# 处理目录下所有 PDF
帮我批量提取 ./pdf_folder 中所有 PDF 的文本内容
```

**条件转换**
```
将这个 PDF 转换为图片，
仅保留第 1-5 页
@source.pdf
```

#### 2.5 XLSX Skill 详解

##### 核心功能

**创建结构化数据**
```
创建一个产品销售统计表，
包含：产品名称、销售数量、销售额、利润率、同比增长
示例数据：5条产品记录
```

**数据分析与可视化**
```
分析这个 Excel 文件，
生成销售趋势图表和关键指标总结
@sales_data.xlsx
```

**公式与自动计算**
```
创建财务预算表，
包含收入、成本、利润等项目，
自动计算小计和总计
```

**数据透视和统计**
```
基于这个数据文件，
按地区和产品类别生成销售汇总表
@detailed_sales.xlsx
```

##### XLSX 最佳实践

- 使用清晰的列标题，便于后续数据处理
- 为重要数值设置格式化规则（如颜色分级）
- 提供数据验证规则防止错误输入
