---
outline: [2, 3]
pageClass: project-intro
---

# 项目介绍

RuoYi AI 是面向开发者的开源 AI 应用开发平台，提供 Java 后端、管理端和用户端。你可以统一接入模型，管理业务知识，配置智能体与工具，并通过可视化工作流组织任务，用于构建智能问答、资料检索、数据分析等应用。

管理端负责模型、知识库和应用配置，用户端提供对话、应用市场与媒体工作台。项目也提供接口和扩展代码，便于接入已有业务系统。

[查看源码](https://gitee.com/ageerle/ruoyi-ai) · [本地安装](./install.md) · [Docker 部署](./docker.md) · [反馈问题](https://gitee.com/ageerle/ruoyi-ai/issues)

## 快速体验

| 服务 | 访问地址 | 默认账号 |
| --- | --- | --- |
| 管理端 | [http://129.226.199.247:25666](http://129.226.199.247:25666) | admin / admin123 |
| 用户端 | [http://129.226.199.247:25137](http://129.226.199.247:25137) | admin / admin123 |
| 商业版 | [https://web.ruoyiai.chat](https://web.ruoyiai.chat) | 微信扫码登录 |

## 核心能力

从接入一个模型开始，可以逐步增加知识库、工具和业务流程，组合出适合自己场景的 AI 应用。

| 能力 | 可以做什么 |
| --- | --- |
| [模型管理](../features/model.md)与[平台接入](../features/models-platforms-integration.md) | 统一维护厂商、模型和用途，接入 DeepSeek、PPIO 及自定义 OpenAI、Anthropic 兼容协议服务，也可按平台适配方式接入已有 AI 应用。 |
| [知识库与 RAG](../features/knowledge.md) | 上传业务文档，解析为知识片段，测试检索效果，为智能体和工作流提供参考资料；支持混合检索与重排。 |
| [对话与上下文](../features/context.md) | 保存历史消息、恢复会话，并结合当前问题与知识片段组织模型请求，支持同一会话内的连续追问。 |
| [工具管理](../features/tools.md)与[MCP](../features/mcp.md) | 使用内置文件、命令和数据库工具，或连接本地、远程 MCP 服务，扩展应用可执行的任务。 |
| [智能体](../features/agent.md) | 组合模型、知识库和工具，处理问答、资料检索、数据库问数及图表生成等任务。 |
| [流程编排](../features/orchestration.md) | 在画布上连接输入、模型、条件分支和外部服务，将多步任务组织为可复用的 AI 工作流。 |
| [Skills](../features/skills.md) | 将任务说明、脚本和参考资料组织为技能，在 Coding Harness 中按需加载；普通智能体目前仅保存技能关联。 |
| [媒体工作台](../features/multimodal.md) | 提供图片、语音、视频的参数设置、任务查询与结果预览入口；实际生成需按媒体教程补齐对应厂商的凭据接入。 |

首次使用建议先完成[本地安装](./install.md)，再配置一个对话模型。基础对话正常后，按需要接入知识库、工具、智能体或工作流。各模块的配置条件、支持范围和扩展方法见上表中的教程。

## 界面预览

下面展示管理端、用户端及主要功能的页面和操作示例。点击图片可放大预览，点击关闭按钮、图片外的空白区域或按 Esc 即可返回正文。具体使用方法见各节的教程链接。

### 管理端与用户端

<div class="image-gallery">

[![管理端首页：通过左侧菜单进入模型、智能体、工具和系统管理](/images/projection/overview/admin-dashboard.png)](/images/projection/overview/admin-dashboard.png)

[![用户端对话首页：新建对话、选择模型和查看历史会话](/images/projection/overview/user-chat.png)](/images/projection/overview/user-chat.png)

[![应用市场：按类型查找并使用智能体和工作流](/images/projection/overview/user-app-market.png)](/images/projection/overview/user-app-market.png)

</div>

管理端集中维护应用配置，用户端提供日常对话和应用入口。应用市场将智能体与工作流放在同一页面，便于按任务选择。管理端首页的统计图表为模板示例。

### 模型与平台接入

<div class="image-gallery">

[![厂商管理：维护厂商名称、编码、接口地址与启用状态](/images/projection/overview/provider-list.png)](/images/projection/overview/provider-list.png)

[![模型管理：按对话、向量、重排、图像和视频等用途管理模型](/images/projection/overview/model-list.png)](/images/projection/overview/model-list.png)

</div>

厂商与模型分别维护，同一厂商可以配置多个模型。模型按对话、向量、重排和媒体等用途分类，便于在不同功能中选择。接入方式与凭据配置见[模型管理](../features/model.md)和[平台接入](../features/models-platforms-integration.md)。

### 图片、语音与视频工作台

<div class="image-gallery">

[![图片工作台：选择图像模型，填写画面描述与可选参数](/images/projection/overview/media-image.png)](/images/projection/overview/media-image.png)

[![语音工作台：选择语音模型并输入需要朗读的文本](/images/projection/overview/media-audio.png)](/images/projection/overview/media-audio.png)

[![视频工作台：填写场景描述，查看视频任务与预览区域](/images/projection/overview/media-video.png)](/images/projection/overview/media-video.png)

</div>

媒体工作台为图片、语音和视频提供独立表单，并集中展示任务记录与结果。上图展示参数填写界面；实际生成所需的厂商支持与凭据接入见[多模态与媒体能力](../features/multimodal.md)。

### 知识管理与 RAG

<div class="image-gallery">

[![知识文档：查看上传文件的解析与向量化状态](/images/knowledge/file-parsed.png)](/images/knowledge/file-parsed.png)

[![知识片段：查看文档拆分后的内容](/images/knowledge/fragments.png)](/images/knowledge/fragments.png)

[![检索测试：检查问题命中的片段及相似度](/images/knowledge/retrieval-result.png)](/images/knowledge/retrieval-result.png)

</div>

文档上传后会经过解析、分块和向量化。通过查看知识片段与检索结果，可以检查资料是否被正确处理，再将知识库关联到智能体或工作流。详细步骤见[知识管理](../features/knowledge.md)。

### 连续对话与会话记录

<div class="image-gallery">

[![连续追问：模型结合上一轮对话回答当前问题](/images/memory/runtime/memory-context-recall.png)](/images/memory/runtime/memory-context-recall.png)

[![历史会话：刷新后重新打开对话，恢复已保存的消息](/images/memory/runtime/memory-session-restored.png)](/images/memory/runtime/memory-session-restored.png)

</div>

同一会话中的历史消息可以参与后续问答，刷新页面后也能重新打开已保存的记录。当前记忆范围为单个会话；上下文组装与扩展方式见[上下文管理](../features/context.md)。

### 工具、MCP 与 Skills

<div class="image-gallery">

[![工具管理：集中查看内置工具与已配置的 MCP 服务](/images/projection/overview/mcp-tools.png)](/images/projection/overview/mcp-tools.png)

[![技能关联：在配置表单中选择工作区提供的技能](/images/skills/agent-skill-options.png)](/images/skills/agent-skill-options.png)

</div>

工具与 MCP 用于连接文件、数据库和外部服务；Skills 用于组织任务说明、脚本与参考资料。技能执行目前主要用于 Coding Harness，普通智能体表单中的技能关联尚未进入执行流程。接入方法见[工具管理](../features/tools.md)、[MCP 管理](../features/mcp.md)和[技能管理](../features/skills.md)。

### 可视化流程编排

<div class="image-gallery">

[![流程列表：维护工作流名称、节点数量和公开状态](/images/projection/overview/workflow-list.png)](/images/projection/overview/workflow-list.png)

[![流程设计：根据输入的发布环境，通过条件分支生成不同检查清单](/images/projection/overview/workflow-designer.png)](/images/projection/overview/workflow-designer.png)

</div>

在画布上拖拽节点、配置参数和连接分支，就能把多步任务组织成工作流。图中的发布检查助手根据输入环境选择不同清单模板；公开后的流程可从用户端应用市场进入。节点类型与调试方法见[流程编排](../features/orchestration.md)。

### 智能体应用

<div class="image-gallery">

[![智能体列表：维护应用名称、描述、绑定模型与状态](/images/projection/overview/agent-list.png)](/images/projection/overview/agent-list.png)

[![智能体对话示例：在用户端选择应用并获得回答](/images/agent/runtime-chat-success.png)](/images/agent/runtime-chat-success.png)

</div>

在管理端为智能体配置模型、知识库和所需工具，再从用户端选择应用开展对话。模型和工具应按任务需要配置，具体步骤见[智能体管理](../features/agent.md)。


## 项目结构

项目由 `ruoyi-ai` 后端、`ruoyi-admin` 管理端和 `ruoyi-web` 用户端三个仓库组成。下面展开的是后端仓库；其中的 `ruoyi-admin` 是 Java 启动模块，与独立的管理端前端仓库不同。

::: details 点击查看详细项目结构
```
ruoyi-ai/
├── 🚀 ruoyi-admin/                          # 管理启动模块
│   ├── src/main/java/org/ruoyi/
│   │   ├── RuoYiAIApplication.java          # 主启动类
│   │   ├── RuoYiAIServletInitializer.java   # 容器部署初始化
│   │   └── controller/                      # 控制器(认证、验证码、首页)
│   ├── src/main/resources/
│   │   ├── application.yml                  # 主配置文件
│   │   ├── application-dev.yml              # 开发环境配置
│   │   ├── application-prod.yml             # 生产环境配置
│   │   ├── logback-plus.xml                 # 日志配置
│   │   ├── banner.txt                       # 启动横幅
│   │   ├── ip2region.xdb                    # IP定位数据库
│   │   ├── i18n/                            # 国际化资源
│   │   └── skills/                          # 内置技能脚本(docx/pdf/xlsx)
│   ├── Dockerfile
│   └── pom.xml
│
├── 🔧 ruoyi-common/                         # 通用模块组
│   ├── ruoyi-common-bom/                # 依赖包管理
│   ├── ruoyi-common-core/               # 核心模块(常量、工具类、配置)
│   ├── ruoyi-common-chat/               # 聊天通用模块
│   ├── ruoyi-common-security/           # 安全模块(认证、授权)
│   ├── ruoyi-common-redis/              # Redis缓存模块
│   ├── ruoyi-common-mybatis/            # MyBatis数据库模块
│   ├── ruoyi-common-web/                # Web通用模块
│   ├── ruoyi-common-satoken/            # SaToken权限模块
│   ├── ruoyi-common-oss/                # 对象存储模块
│   ├── ruoyi-common-sms/                # 短信模块
│   ├── ruoyi-common-mail/               # 邮件模块
│   ├── ruoyi-common-excel/              # Excel处理模块
│   ├── ruoyi-common-log/                # 日志模块
│   ├── ruoyi-common-json/               # JSON序列化模块
│   ├── ruoyi-common-encrypt/            # 加解密模块
│   ├── ruoyi-common-sensitive/          # 数据脱敏模块
│   ├── ruoyi-common-idempotent/         # 幂等性模块
│   ├── ruoyi-common-ratelimiter/        # 限流模块
│   ├── ruoyi-common-tenant/             # 多租户模块
│   ├── ruoyi-common-translation/        # 翻译模块
│   ├── ruoyi-common-doc/                # 接口文档模块
│   ├── ruoyi-common-job/                # 定时任务模块
│   ├── ruoyi-common-social/             # 社交登录模块
│   ├── ruoyi-common-sse/                # SSE推送模块
│   └── ruoyi-common-websocket/          # WebSocket模块
│
├── 📦 ruoyi-modules/                        # 业务模块组
│   ├── ruoyi-system/                    # 系统管理模块
│   │   ├── src/main/java/              # 用户、角色、菜单、部门等管理
│   │   └── pom.xml
│   ├── ruoyi-chat/                      # 聊天业务模块
│   │   ├── src/main/java/              # 聊天接口、服务(智能体、MCP、知识库、OpenAI、FastGPT、Dify等)
│   │   │   ├── agent/                  # 智能体(config/domain/manager/tool)
│   │   │   ├── controller/             # 控制器(agent/chat/coding/knowledge/mcp/shortdrama)
│   │   │   ├── domain/                 # 实体与数据传输对象(bo/dto/entity/vo)
│   │   │   ├── mapper/                 # 数据访问层(agent/chat/knowledge)
│   │   │   ├── factory/                # 模型工厂
│   │   │   └── config/                 # 配置(agent/mcp)
│   │   └── pom.xml
│   ├── ruoyi-generator/                 # 代码生成模块
│   │   ├── src/main/java/              # 代码生成接口与服务
│   │   └── pom.xml
│   ├── ruoyi-aiflow/                    # AI流程编排模块
│   │   ├── src/main/java/
│   │   └── pom.xml
│   └── ruoyi-workflow/                  # 工作流模块
│       ├── src/main/java/
│       └── pom.xml
│
├── 🚀 ruoyi-extend/                         # 扩展模块
│   ├── ruoyi-monitor-admin/             # 服务监控管理
│   │   ├── src/main/java/
│   │   ├── Dockerfile
│   │   └── pom.xml
│   └── ruoyi-snailjob-server/           # 分布式任务调度服务
│       ├── src/main/java/
│       ├── Dockerfile
│       └── pom.xml
│
├── 📜 docs/                               # 部署与脚本
│   ├── docker/                          # Docker编排配置
│   │   ├── ruoyi-ai/                   # 主项目Docker配置
│   │   ├── milvus/                      # Milvus向量数据库
│   │   ├── weaviate/                    # Weaviate向量数据库
│   │   ├── qdrant/                      # Qdrant向量数据库
│   │   ├── neo4j/                       # Neo4j图数据库
│   │   └── minio/                       # MinIO对象存储
│   ├── script/
│   │   ├── sql/                         # 数据库脚本(初始化&更新)
│   │   ├── leave/                       # 工作流请假示例JSON
│   │   └── install-ffmpeg-windows.ps1   # Windows 安装 ffmpeg 脚本
│   └── image/                           # 项目图片资源
│
├── 📝 logs/                               # 日志文件目录
├── pom.xml                             # 根项目Maven配置
├── README.md                           # 项目说明文档(中文)
├── README_EN.md                        # 项目说明文档(英文)
├── LICENSE                             # 开源协议
└── .editorconfig                        # 编辑器规范配置
```
:::

## 推荐开发环境

首次安装可使用下列版本组合。工具下载地址、环境配置与启动命令见[本地安装教程](./install.md#prerequisites)。

| 组件 | 建议版本 | 说明 |
|------|----------|------|
| JDK | `21` | 编译和运行 Java，项目源码目标为 Java 17。 |
| MySQL | `8.0` | 保存账号、配置与业务数据。 |
| Redis | `6.2` | 与本地安装教程的 Compose 配置一致。 |
| Maven | `3.9.x` | 下载 Java 依赖并构建后端。 |
| Node.js | `24 LTS` | 运行前端开发工具。 |
| pnpm | `10.14.0` | 与管理端仓库锁定版本一致。 |

<style>
.project-intro .image-gallery { grid-template-columns: minmax(0, 1fr); gap: 16px; }
.project-intro .image-gallery p { margin: 0; }
.project-intro .image-gallery a { display: block; line-height: 0; cursor: zoom-in; }
.project-intro .image-gallery a:focus-visible { outline: 3px solid var(--vp-c-brand-1); outline-offset: 4px; border-radius: 8px; }
.project-intro .image-gallery img { border: 1px solid var(--vp-c-divider); box-shadow: none; }
.project-intro .image-gallery img:hover { transform: none; }
</style>
