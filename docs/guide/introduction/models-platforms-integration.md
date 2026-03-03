# 模型与平台集成

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 一、通用模型集成

### 1.1 接入PPIO派欧云

#### 注册和创建API密钥

1. 访问PPIO派欧云官网
```
https://ppio.cn/user/register?from=ppinfra&invited_by=P8QTUY&utm_source=github_ruoyi-ai
```

2. 登录后点击右上角控制台，控制台页面右上角点击《账号管理》，然后左侧菜单栏切换到《API 密钥管理》创建密钥
   ![alt text](/images/model/mode-01.png)

**优惠信息：**
- 使用邀请码 **P8QTUY** 获取更多免费额度
- 注册后会赠送5元免费额度
- 普通用户并发限制是10次/分钟，如果并发较大可以联系客服升级

#### 配置模型信息

1. 在模型广场选择一个模型
   ![alt text](/images/model/mode-02.png)

2. 后台模型管理配置（注意结尾没有/）
   ![alt text](/images/model/mode-03.png)

3. 效果展示
   ![alt text](/images/model/mode-04.png)

---

## 二、Dify工作流平台

### 2.1 什么是Dify

Dify 是一个开源的大语言模型（LLM）应用开发平台。提供一套完整的工具和平台，帮助开发者快速构建和部署基于LLM的应用。

### 2.2 配置步骤

1. 登录dify官网，创建一个应用
   ![alt text](/images/dify/dify-01.png)

2. 检查模型设置，配置自己的密钥信息
   ![alt text](/images/dify/dify-02.png)
   ![alt text](/images/dify/dify-03.png)

3. 发布完成后，点击访问API
   ![alt text](/images/dify/dify-04.png)

4. 创建密钥
   ![alt text](/images/dify/dify-05.png)

5. 后台管理配置
   ![alt text](/images/dify/dify-06.png)

6. 效果演示
   ![alt text](/images/dify/dify-07.png)

---

## 三、Coze机器人平台

### 3.1 什么是Coze

Coze（扣子）是字节跳动旗下的AI Bot开发平台。提供强大的Agent框架和工作流编排能力，支持多渠道部署和丰富的集成选项。

### 3.2 配置步骤

1. 访问扣子官网创建一个智能体
   ![alt text](/images/coze/coze-01.png)

2. 创建完成后，先复制botId，然后点击发布
   ![alt text](/images/coze/coze-02.png)

3. 只用勾选API，然后点击发布
   ![alt text](/images/coze/coze-03.png)

4. 创建个人访问令牌
   ![alt text](/images/coze/coze-04.png)

5. 后台模型管理配置
   ![alt text](/images/coze/coze-05.png)

6. 效果展示
   ![alt text](/images/coze/coze-06.png)

---

## 四、FastGPT知识库平台

### 4.1 什么是FastGPT

FastGPT 是一个基于 LLM 大语言模型的知识库问答系统，将智能对话与可视化编排完美结合，让 AI 应用开发变得简单自然。无论您是开发者还是业务人员，都能轻松打造专属的 AI 应用。

🤖 **快速开始体验**
- 海外版：[https://tryfastgpt.ai](https://tryfastgpt.ai)
- 国内版：[https://fastgpt.cn](https://fastgpt.cn)

### 4.2 本地部署 FastGPT

#### 4.2.1 系统要求

- **操作系统**: Ubuntu 22.04
- **Docker**: version 24.0.5
- **Docker Compose**: version v2.18.1

::: warning 参考文档
Docker Compose 快速部署文档参考：[https://doc.tryfastgpt.ai/docs/development/docker/](https://doc.tryfastgpt.ai/docs/development/docker/)
:::

![部署架构图](/images/fastgpt/deployment-architecture.png)

#### 4.2.2 下载部署文件

```bash
# 创建目录
mkdir fastgpt
cd fastgpt

# 下载部署文件（基于pgvector向量库）
curl -O https://raw.githubusercontent.com/labring/FastGPT/main/projects/app/data/config.json

# pgvector 版本(测试推荐，简单快捷)
curl -o docker-compose.yml https://raw.githubusercontent.com/labring/FastGPT/main/deploy/docker/docker-compose-pgvector.yml
```

#### 4.2.3 配置 yaml 文件（pgvector）

成功下载 `config.json`、`docker-compose.yml` 文件

![文件下载成功](/images/fastgpt/file-download-success.png)

::: tip 配置说明
统一修改为 **阿里云拉取镜像地址**，速度快！这里我修改了 **登录 FastGPT 密码、minio 的地址**
:::

```yaml
# 数据库的默认账号和密码仅首次运行时设置有效
# 如果修改了账号密码，记得改数据库和项目连接参数，别只改一处~
# 该配置文件只是给快速启动，测试使用。正式使用，记得务必修改账号密码，以及调整合适的知识库参数，共享内存等。
# 如何无法访问 dockerhub 和 git，可以用阿里云（阿里云没有arm包）

version: '3.3'
services:
  # Vector DB
  pg:
    # image: pgvector/pgvector:0.8.0-pg15 # docker hub
    image: registry.cn-hangzhou.aliyuncs.com/fastgpt/pgvector:v0.8.0-pg15 # 阿里云
    container_name: pg
    restart: always
    # ports: # 生产环境建议不要暴露
    #   - 5432:5432
    networks:
      - fastgpt
    environment:
      # 这里的配置只有首次运行生效。修改后，重启镜像是不会生效的。需要把持久化数据删除再重启，才有效果
      - POSTGRES_USER=username
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=postgres
    volumes:
      - ./pg/data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'username', '-d', 'postgres']
      interval: 5s
      timeout: 5s
      retries: 10

  # DB
  mongo:
    # image: mongo:5.0.18 # dockerhub
    image: registry.cn-hangzhou.aliyuncs.com/fastgpt/mongo:5.0.18 # 阿里云
    # image: mongo:4.4.29 # cpu不支持AVX时候使用
    container_name: mongo
    restart: always
    networks:
      - fastgpt
    command: mongod --keyFile /data/mongodb.key --replSet rs0
    environment:
      - MONGO_INITDB_ROOT_USERNAME=myusername
      - MONGO_INITDB_ROOT_PASSWORD=mypassword
    volumes:
      - ./mongo/data:/data/db
    entrypoint:
      - bash
      - -c
      - |
        openssl rand -base64 128 > /data/mongodb.key
        chmod 400 /data/mongodb.key
        chown 999:999 /data/mongodb.key
        echo 'const isInited = rs.status().ok === 1
        if(!isInited){
          rs.initiate({
              _id: "rs0",
              members: [
                  { _id: 0, host: "mongo:27017" }
              ]
          })
        }' > /data/initReplicaSet.js
        # 启动MongoDB服务
        exec docker-entrypoint.sh "$$@" &

        # 等待MongoDB服务启动
        until mongo -u myusername -p mypassword --authenticationDatabase admin --eval "print('waited for connection')"; do
          echo "Waiting for MongoDB to start..."
          sleep 2
        done

        # 执行初始化副本集的脚本
        mongo -u myusername -p mypassword --authenticationDatabase admin /data/initReplicaSet.js

        # 等待docker-entrypoint.sh脚本执行的MongoDB服务进程
        wait $$!

  redis:
    image: redis:7.2-alpine
    container_name: redis
    networks:
      - fastgpt
    restart: always
    command: |
      redis-server --requirepass mypassword --loglevel warning --maxclients 10000 --appendonly yes --save 60 10 --maxmemory 4gb --maxmemory-policy noeviction
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', 'mypassword', 'ping']
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 30s
    volumes:
      - ./redis/data:/data

  fastgpt-minio:
    image: minio/minio:latest
    container_name: fastgpt-minio
    restart: always
    networks:
      - fastgpt
    ports: # comment out if you do not need to expose the port (in production environment, you should not expose the port)
      - '9000:9000'
      - '9001:9001'
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - ./fastgpt-minio:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
      interval: 30s
      timeout: 20s
      retries: 3

  fastgpt:
    container_name: fastgpt
    # image: ghcr.io/labring/fastgpt:v4.10.0 # git
    image: registry.cn-hangzhou.aliyuncs.com/fastgpt:v4.10.0 # 阿里云
    ports:
      - 3000:3000
    networks:
      - fastgpt
    depends_on:
      - mongo
      - sandbox
      - pg
    restart: always
    environment:
      # 前端外部可访问的地址，用于自动补全文件资源路径。例如 https:fastgpt.cn，不能填 localhost。这个值可以不填，不填则发给模型的图片会是一个相对路径，而不是全路径，模型可能伪造Host。
      - FE_DOMAIN=
      # root 密码，用户名为: root。如果需要修改 root 密码，直接修改这个环境变量，并重启即可。
      - DEFAULT_ROOT_PSW=ruoyi-ai@lindaxia  # 登录凭证密钥
      - TOKEN_KEY=any
      # root的密钥，常用于升级时候的初始化请求
      - ROOT_KEY=root_key
      # 文件阅读加密
      - FILE_TOKEN_KEY=filetoken
      # 密钥加密key
      - AES256_SECRET_KEY=fastgptkey

      # plugin 地址
      - PLUGIN_BASE_URL=http://fastgpt-plugin:3000
      - PLUGIN_TOKEN=xxxxxx
      # sandbox 地址
      - SANDBOX_URL=http://sandbox:3000
      # AI Proxy 的地址，如果配了该地址，优先使用
      - AIPROXY_API_ENDPOINT=http://aiproxy:3000
      # AI Proxy 的 Admin Token，与 AI Proxy 中的环境变量 ADMIN_KEY
      - AIPROXY_API_TOKEN=aiproxy

      # 数据库最大连接数
      - DB_MAX_LINK=30
      # MongoDB 连接参数. 用户名myusername,密码mypassword。
      - MONGODB_URI=mongodb://myusername:mypassword@mongo:27017/fastgpt?authSource=admin
      # Redis 连接参数
      - REDIS_URL=redis://default:mypassword@redis:6379
      # 向量库 连接参数
      - PG_URL=postgresql://username:password@pg:5432/postgres

      # 日志等级: debug, info, warn, error
      - LOG_LEVEL=info
      - STORE_LOG_LEVEL=warn
      # 工作流最大运行次数
      - WORKFLOW_MAX_RUN_TIMES=1000
      # 批量执行节点，最大输入长度
      - WORKFLOW_MAX_LOOP_TIMES=100
      # 对话文件过期天数
      - CHAT_FILE_EXPIRE_TIME=7
    volumes:
      - ./config.json:/app/data/config.json

  sandbox:
    container_name: sandbox
    # image: ghcr.io/labring/fastgpt-sandbox:v4.10.0 # git
    image: registry.cn-hangzhou.aliyuncs.com/fastgpt-sandbox:v4.10.0 # 阿里云
    networks:
      - fastgpt
    restart: always

  fastgpt-mcp-server:
    container_name: fastgpt-mcp-server
    # image: ghcr.io/labring/fastgpt-mcp_server:v4.10.0 # git
    image: registry.cn-hangzhou.aliyuncs.com/fastgpt-mcp_server:v4.10.0 # 阿里云
    ports:
      - 3005:3000
    networks:
      - fastgpt
    restart: always
    environment:
      - FASTGPT_ENDPOINT=http://fastgpt:3000

  fastgpt-plugin:
    # image: ghcr.io/labring/fastgpt-plugin:v0.1.0 # git
    image: registry.cn-hangzhou.aliyuncs.com/fastgpt-plugin:v0.1.0 # 阿里云
    container_name: fastgpt-plugin
    restart: always
    networks:
      - fastgpt
    environment:
      - AUTH_TOKEN=xxxxxx # disable authentication token if you do not set this variable
      # 改成 minio 公网地址 例如 http://minio.xxx.com 或者  http://<ip>:<port>
      - MINIO_CUSTOM_ENDPOINT=http://192.168.1.126:9000
      - MINIO_ENDPOINT=fastgpt-minio
      - MINIO_PORT=9000
      - MINIO_USE_SSL=false
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - MINIO_BUCKET=fastgpt-plugins
    depends_on:
      fastgpt-minio:
        condition: service_healthy

  # AI Proxy
  aiproxy:
    # image: ghcr.io/labring/aiproxy:v0.1.7
    image: registry.cn-hangzhou.aliyuncs.com/labring/aiproxy:v0.1.7 # 阿里云
    container_name: aiproxy
    restart: unless-stopped
    depends_on:
      aiproxy_pg:
        condition: service_healthy
    networks:
      - fastgpt
    environment:
      # 对应 fastgpt 里的AIPROXY_API_TOKEN
      - ADMIN_KEY=aiproxy
      # 错误日志详情保存时间（小时）
      - LOG_DETAIL_STORAGE_HOURS=1
      # 数据库连接地址
      - SQL_DSN=postgres://postgres:aiproxy@aiproxy_pg:5432/aiproxy
      # 最大重试次数
      - RETRY_TIMES=3
      # 不需要计费
      - BILLING_ENABLED=false
      # 不需要严格检测模型
      - DISABLE_MODEL_CONFIG=true
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/status']
      interval: 5s
      timeout: 5s
      retries: 10

  aiproxy_pg:
    # image: pgvector/pgvector:0.8.0-pg15 # docker hub
    image: registry.cn-hangzhou.aliyuncs.com/fastgpt/pgvector:v0.8.0-pg15 # 阿里云
    restart: unless-stopped
    container_name: aiproxy_pg
    volumes:
      - ./aiproxy_pg:/var/lib/postgresql/data
    networks:
      - fastgpt
    environment:
      TZ: Asia/Shanghai
      POSTGRES_USER: postgres
      POSTGRES_DB: aiproxy
      POSTGRES_PASSWORD: aiproxy
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'postgres', '-d', 'aiproxy']
      interval: 5s
      timeout: 5s
      retries: 10

networks:
  fastgpt:
```

#### 4.2.4 启动容器

```bash
cd fastgpt

# 启动容器
docker-compose up -d

# 关闭容器
docker-compose down
```

![容器启动成功](/images/fastgpt/container-startup.png)

#### 4.2.5 检查容器状态

![容器状态检查](/images/fastgpt/container-status.png)

### 4.3 测试访问

::: tip 访问信息
- **访问地址**: [http://192.168.1.126:3000/login](http://192.168.1.126:3000/login)
- **登录账号**: root/ruoyi-ai@lindaxia
:::

成功登录！

![登录成功界面](/images/fastgpt/login-success.png)

### 4.4 配置 FastGPT

#### 4.4.1 模型配置

选择模型商进行测试（以PPIO欧派云为例）：

::: info 参考文档
- 接入参考文档：[https://ppio.cn/docs/third-party/fastgpt-use](https://ppio.cn/docs/third-party/fastgpt-use)
- 官方文档：[https://ppio.cn/model-api/console](https://ppio.cn/model-api/console)
:::

![PPIO 模型商界面](/images/fastgpt/ppio-interface.png)

**索引模型（qwen/qwen3-embedding-8b）**

![索引模型配置](/images/fastgpt/index-model-config.png)

点击"新增模型"，配置好模型参数，点击"确定"

::: details 模型配置参数
- **模型**: qwen/qwen3-embedding-8b
- **默认分块长度**: 1024
- **最大上下文**: 4096
- **额外 Body 参数**:
  ```json
  {
    "dimensions": 1024
  }
  ```
- **API地址**: [https://api.ppinfra.com/v3/openai/embeddings](https://api.ppinfra.com/v3/openai/embeddings)
- **API令牌**: xxxxxxxxxxxxx
:::

![模型配置界面](/images/fastgpt/model-config-interface.png)

点击"模型测试"通过

![模型测试通过](/images/fastgpt/model-test-pass.png)

**语言模型**

![语言模型配置](/images/fastgpt/language-model-config.png)

点击"新增模型"，配置好模型参数，点击"确定"

::: details 语言模型配置参数
- **最大上下文**: 163840
- **知识库最大引用**: 163840
- **最大响应 tokens**: 20000
- **最大温度**: 1.2
- **响应格式**:
  ```json
  [
    "text",
    "json_object",
    "json_schema"
  ]
  ```
- **API地址**: [https://api.ppinfra.com/v3/openai/chat/completions](https://api.ppinfra.com/v3/openai/chat/completions)
:::

![语言模型配置界面](/images/fastgpt/language-model-interface.png)

点击"模型测试"通过

![语言模型测试通过](/images/fastgpt/language-model-test.png)

#### 4.4.2 新增知识库

![知识库创建](/images/fastgpt/knowledge-base-create.png)

**分块详情**

![分块详情配置](/images/fastgpt/chunk-details.png)

**新建成功**

![知识库创建成功](/images/fastgpt/knowledge-base-success.png)

#### 4.4.3 创建简易应用（AMD产品智能客服示例）

![应用创建界面](/images/fastgpt/app-create-interface.png)

**AI 配置**

![AI 配置界面](/images/fastgpt/ai-config-interface.png)

**调试预览示例**: AMD9334 是 AMD ZEN4 产品的么？

![调试预览结果](/images/fastgpt/debug-preview.png)

**保存应用**

![应用保存成功](/images/fastgpt/app-save-success.png)

#### 4.4.4 发布渠道（外部调用 API）

创建 FastGPT 应用 API 访问的 key

![API Key 创建](/images/fastgpt/api-key-create.png)

### 4.5 项目接入 FastGPT 对话

#### 4.5.1 环境准备

::: tip 前置条件
ruoyi-ai、ruoyi-admin、ruoyi-web 服务正常运行
:::

#### 4.5.2 ruoyi-admin 端配置系统模型

成功登录：[http://localhost:5666/operate/model](http://localhost:5666/operate/model)

在系统模型页配置 FastGPT 模型分类！

![系统模型配置](/images/fastgpt/system-model-config.png)

**配置详情**

![模型配置详情](/images/fastgpt/model-config-details.png)

#### 4.5.3 ruoyi-web 端进行对话

成功登录：[http://localhost:1002](http://localhost:1002)

**配置模型切换**

::: warning 注意
这里模型为 admin 端配置的模型描述，是个小 bug，后续优化
:::

![模型切换配置](/images/fastgpt/model-switch-config.png)

**提问测试**

**测试问题示例**：
- Ryzen 9 7950X 的最大加速频率是多少
- AMD PRO 商用平台技术包括哪些

![对话测试结果](/images/fastgpt/chat-test-result.png)

::: tip 说明
当前在 ruoyi-web 响应结构需要优化，当前教程重在演示集成 FastGPT 操作步骤！
:::

#### 4.5.4 检查 FastGPT 端日志记录

登录 [http://192.168.1.126:3000/](http://192.168.1.126:3000/)，查看对话日志，成功接入调用 FastGPT 端

![FastGPT 日志记录](/images/fastgpt/fastgpt-logs.png)

### 4.6 接入 FastGPT 源码说明

在 ruoyi-ai 项目 master 分支中已经合并了开发提的 pr，在此感谢开发者 @龙卷风 对 ruoyi-ai 项目的大力支持！🙏

![源码贡献记录](/images/fastgpt/source-contribution.png)

---

## 总结

| 平台 | 特点 | 适用场景 |
|------|------|--------|
| **通用模型** | 支持OpenAI、DeepSeek等上百个大模型 | 通用对话、文本生成 |
| **Dify** | 工作流编排、可视化配置 | 复杂业务流程、企业应用 |
| **Coze** | 字节跳动产品、Bot框架完整 | 智能机器人、多渠道部署 |
| **FastGPT** | 知识库导向、RAG优化 | 企业知识库、FAQ系统 |

根据你的需求选择合适的平台进行集成，充分利用 RuoYi AI 平台的模型管理能力！