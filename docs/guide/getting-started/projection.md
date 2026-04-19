# 项目介绍
::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 快速体验

::: info 在线演示
- 🌐 [用户端体验](https://web.pandarobot.chat/) - 账号：admin 密码：admin123
- 🛠️ [管理后台](https://admin.pandarobot.chat/) - 账号：admin 密码：admin123
  :::


## 📁 项目结构

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
│   │   ├── src/main/java/              # 聊天接口、服务(OpenAI、FastGPT、Dify等)
│   │   ├── docs/                        # 模块文档(MCP工具接口、数据库智能体)
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
│   │   ├── docker/                      # Docker辅助脚本
│   │   └── leave/                       # 工作流请假示例JSON
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

## 🛠️ 开发环境要求
| 组件 | 版本要求 | 说明 |
|------|----------|------|
| ☕ **JDK** | `17+` | Java开发工具包 |
| 🗄️ **MySQL** | `8.0` | 关系型数据库 |
| 🔴 **Redis** | `>= 5.X` | 内存数据库（版本必须大于等于5.X） |
| 📦 **Maven** | `3.8+` | 项目构建工具 |
| 🟢 **Node.js** | `20+` | JavaScript运行环境 |
| 📦 **pnpm** | `latest` | 包管理工具 |

## 🎯 项目演示

### 🤖 MCP功能展示

<div class="image-gallery">

![MCP功能界面1](/images/projection/mcp-01.webp)

![MCP功能界面2](/images/projection/mcp-02.webp)

![MCP功能界面3](/images/projection/mcp-03.webp)

![MCP功能界面4](/images/projection/mcp-04.webp)

</div>

### 👥 用户端界面

<div class="image-gallery">

![用户端界面1](/images/projection/web-01.webp)

![用户端界面2](/images/projection/web-02.webp)

</div>

### 🛠️ 管理端界面

<div class="image-gallery">

![管理端界面1](/images/projection/admin-01.webp)

![管理端界面2](/images/projection/admin-02.webp)

![管理端界面3](/images/projection/admin-03.webp)

![管理端界面4](/images/projection/admin-04.webp)

</div>
