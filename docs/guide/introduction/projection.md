# 项目介绍
::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 快速体验

::: info 在线演示
- 🌐 [用户端体验](https://web.pandarobot.chat/) - 账号：demo 密码：demo123
- 🛠️ [管理后台](https://admin.pandarobot.chat/) - 账号：admin 密码：admin123
  :::


## 📁 项目结构

::: details 点击查看详细项目结构
```
ruoyi-ai/
├── 🚀 ruoyi-admin/                    # 管理启动模块
│   ├── src/main/java/
│   │   └── org/ruoyi/
│   │       ├── RuoYiAIApplication.java         # 主启动类
│   │       ├── RuoYiAIServletInitializer.java  # 容器部署初始化
│   │       └── controller/                     # 控制器
│   ├── src/main/resources/
│   │   ├── application.yml                     # 主配置文件
│   │   ├── application-dev.yml                 # 开发环境配置
│   │   ├── application-prod.yml                # 生产环境配置
│   │   ├── mcp-server.json                     # MCP服务器配置
│   │   ├── banner.txt                          # 启动横幅
│   │   └── logback-plus.xml                    # 日志配置
│   └── pom.xml
│
├── 🔧 ruoyi-common/                   # 通用模块组
│   ├── ruoyi-common-bom/           # 依赖包管理
│   ├── ruoyi-common-core/          # 核心模块(常量、工具类、配置)
│   ├── ruoyi-common-chat/          # 聊天通用模块
│   ├── ruoyi-common-security/      # 安全模块(认证、授权)
│   ├── ruoyi-common-redis/         # Redis缓存模块
│   ├── ruoyi-common-mybatis/       # MyBatis数据库模块
│   ├── ruoyi-common-web/           # Web通用模块
│   ├── ruoyi-common-satoken/       # SaToken权限模块
│   ├── ruoyi-common-oss/           # 对象存储模块
│   ├── ruoyi-common-pay/           # 支付模块
│   ├── ruoyi-common-sms/           # 短信模块
│   ├── ruoyi-common-mail/          # 邮件模块
│   ├── ruoyi-common-excel/         # Excel处理模块
│   ├── ruoyi-common-log/           # 日志模块
│   ├── ruoyi-common-json/          # JSON序列化模块
│   ├── ruoyi-common-encrypt/       # 加解密模块
│   ├── ruoyi-common-sensitive/     # 数据脱敏模块
│   ├── ruoyi-common-idempotent/    # 幂等性模块
│   ├── ruoyi-common-ratelimiter/   # 限流模块
│   ├── ruoyi-common-tenant/        # 多租户模块
│   ├── ruoyi-common-translation/   # 翻译模块
│   └── ruoyi-common-doc/           # 接口文档模块
│
├── 📦 ruoyi-modules/                  # 业务模块组
│   ├── ruoyi-system/               # 系统管理模块
│   │   ├── controller/             # 用户、角色、菜单、部门等管理
│   │   ├── service/                # 业务逻辑层
│   │   ├── domain/                 # 实体类
│   │   └── mapper/                 # 数据访问层
│   ├── ruoyi-chat/                 # 聊天业务模块
│   │   ├── controller/             # 聊天接口
│   │   ├── service/                # 聊天服务(OpenAI、FastGPT、Dify等)
│   │   ├── domain/                 # 聊天相关实体
│   │   └── config/                 # 聊天配置
│   └── ruoyi-generator/            # 代码生成模块
│       ├── controller/             # 代码生成接口
│       ├── service/                # 代码生成服务
│       └── util/                   # 生成工具类
│
├── 🔌 ruoyi-modules-api/              # API接口模块
│   ├── ruoyi-system-api/           # 系统API接口定义
│   ├── ruoyi-chat-api/             # 聊天API接口定义
│   └── ruoyi-knowledge-api/        # 知识库API接口定义
│
├── 🚀 ruoyi-extend/                   # 扩展模块
│   ├── ruoyi-mcp-server/           # MCP(Model Context Protocol)服务器
│   │   ├── src/main/java/          # MCP服务器实现
│   │   └── pom.xml
│   └── ruoyi-ai-copilot/           # AI编程助手
│
├── 📜 script/                         # 脚本文件
│   ├── deploy/                     # 部署相关脚本
│   │   ├── build-docker-images/    # Docker镜像构建
│   │   ├── deploy/                 # 部署配置
│   │   └── one-step-script/        # 一键部署脚本
│   ├── docker/                     # Docker配置文件
│   │   └── weaviate/               # Weaviate向量数据库配置
│   └── sql/                        # 数据库脚本
│       ├── ruoyi-ai.sql            # 初始化SQL
│       └── update/                 # 更新SQL脚本
│
├── 📝 logs/                           # 日志文件目录
├── 🖼️ image/                          # 项目图片资源
├── pom.xml                         # 根项目Maven配置
├── README.md                       # 项目说明文档
└── LICENSE                         # 开源协议
```
:::

## 🛠️ 开发环境要求
| 组件 | 版本要求 | 说明 |
|------|----------|------|
| ☕ **JDK** | `17+` | Java开发工具包 |
| 🗄️ **MySQL** | `5.7` / `8.0` | 关系型数据库 |
| 🔴 **Redis** | `>= 5.X` | 内存数据库（版本必须大于等于5.X） |
| 📦 **Maven** | `3.8+` | 项目构建工具 |
| 🟢 **Node.js** | `20+` | JavaScript运行环境 |
| 📦 **pnpm** | `latest` | 包管理工具 |

## 🎯 项目演示

### 🤖 MCP功能展示

<div class="image-gallery">

![MCP功能界面1](/images/projection/mcp-01.png)

![MCP功能界面2](/images/projection/mcp-02.png)

![MCP功能界面3](/images/projection/mcp-03.png)

![MCP功能界面4](/images/projection/mcp-04.png)

</div>

### 👥 用户端界面

<div class="image-gallery">

![用户端界面1](/images/projection/web-01.png)

![用户端界面2](/images/projection/web-02.png)

![用户端界面3](/images/projection/web-03.png)

![用户端界面4](/images/projection/web-04.png)

</div>

### 🛠️ 管理端界面

<div class="image-gallery">

![管理端界面1](/images/projection/admin-01.png)

![管理端界面2](/images/projection/admin-02.png)

![管理端界面3](/images/projection/admin-03.png)

![管理端界面4](/images/projection/admin-04.png)

</div>

### 🤖 编码助手


<div class="image-gallery">

![智能编码1](/images/projection/code-01.png)

![智能编码2](/images/projection/code-02.png)

![智能编码3](/images/projection/code-03.png)

![智能编码4](/images/projection/code-04.png)

</div>

<style>
.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.image-gallery img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.image-gallery img:hover {
  transform: scale(1.05);
}

</style>
