# Claude Code 使用教程 - 进阶篇

## 前言

本篇基于入门篇继续深化，涵盖 MCP 扩展、Skills 工具、复杂项目工作流、性能优化等高级主题。适用于已掌握基础操作的开发者。

---

## 第一章：MCP（模型上下文协议）深度应用

### 1.1 MCP 服务配置与管理

#### 什么是 MCP？
MCP（Model Context Protocol）是扩展 Claude 功能的协议。通过配置 MCP 服务器，可以让 Claude 访问各种外部工具和数据源。

#### 配置文件位置
- 访问mcp广场：https://www.modelscope.cn/mcp

```bash
# Windows
%USERPROFILE%\.claude.json
```

#### 基础配置示例
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

### 1.2 常用 MCP 服务配置

#### 必应搜索（中文）
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

#### 多服务配置
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

### 1.3 查询可用 MCP 工具

在对话中输入：
```
你有哪些 MCP 工具？
```

Claude 将列出所有已配置的 MCP 服务和它们提供的功能。

### 1.4 MCP 的实战应用场景

| 场景 | MCP 工具 | 用法 |
|------|---------|------|
| 实时信息查询 | bing-search | 获取最新新闻、金价、天气等 |
| 数据库操作 | postgresql | 直接查询和修改数据库 |
| 文件系统扩展 | filesystem | 访问系统特定目录 |
| API 集成 | custom-api | 连接企业内部 API |

### 1.5 MCP 配置最佳实践

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

## 第二章：Skills 深度应用

### 2.1 Skills 系统概述

Skills 是 Claude Code 的扩展工具，用于处理特殊文件类型和复杂任务。

#### 三大核心 Skills

| Skill | 功能 | 依赖环境 |
|-------|------|---------|
| **ai-tutor** | 技术教学、概念讲解、视频转录 | Python、FFmpeg |
| **pdf** | PDF 创建、编辑、表单填充、文本提取 | LibreOffice、ReportLab |
| **xlsx** | Excel 创建、数据分析、图表生成 | LibreOffice、openpyxl、pandas |

### 2.2 安装与环境配置

#### 步骤 1：下载 Skills
```bash
# 克隆 Skills 仓库
git clone https://github.com/anthropics/skills.git

# 或访问在线浏览
https://github.com/anthropics/skills/tree/main/skills
```

#### 步骤 2：复制到 Claude 目录
```bash
# Windows
复制到 %USERPROFILE%\.claude\skills\

# macOS/Linux
复制到 ~/.claude/skills/
```

#### 步骤 3：安装依赖环境

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

### 2.3 ai-tutor Skill 详解

#### 功能与应用

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

#### 最佳实践

- 对复杂概念使用 `ultrathink:` 前缀获得更深入的讲解
- 结合上下文参考资料提高讲解的精准度
- 转录长视频时分段处理以提高效率

### 2.4 PDF Skill 详解

#### 核心功能

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

#### PDF 高级用法

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

### 2.5 XLSX Skill 详解

#### 核心功能

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

#### XLSX 最佳实践

- 使用清晰的列标题，便于后续数据处理
- 为重要数值设置格式化规则（如颜色分级）
- 提供数据验证规则防止错误输入

---
