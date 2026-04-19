# FastGPT 集成

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) 的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

::: tip FastGPT 简介
FastGPT 是一个基于 LLM 大语言模型的知识库问答系统，将智能对话与可视化编排完美结合，让 AI 应用开发变得简单自然。无论您是开发者还是业务人员，都能轻松打造专属的 AI 应用。

🤖 **快速开始体验**
- 海外版：[https://tryfastgpt.ai](https://tryfastgpt.ai)
- 国内版：[https://fastgpt.cn](https://fastgpt.cn)
:::

::: warning 图片显示问题
如果您发现本文档中的图片无法显示，这是因为图片使用的是语雀 CDN 链接。可能的原因：
- 防盗链保护：语雀 CDN 设置了 Referer 检查
- 网络访问限制：某些网络环境无法访问语雀 CDN
- 地域限制：不同地区的访问策略不同

**解决方案**：
1. 使用科学上网工具
2. 更换网络环境
3. 直接访问语雀原文档查看图片
:::

![FastGPT 界面展示](/images/fastgpt/fastgpt-interface.webp)

## 一、本地部署 FastGPT - 软件环境

### 系统要求

- **操作系统**: Ubuntu 22.04
- **Docker**: version 24.0.5
- **Docker Compose**: version v2.18.1

## 二、本地部署 FastGPT

::: warning 参考文档
Docker Compose 快速部署文档参考：[https://doc.tryfastgpt.ai/docs/development/docker/](https://doc.tryfastgpt.ai/docs/development/docker/)
:::

![部署架构图](/images/fastgpt/deployment-architecture.webp)

### 2.1 下载部署文件

```bash
# 创建目录
mkdir fastgpt
cd fastgpt

# 下载部署文件（基于pgvector向量库）
curl -O https://raw.githubusercontent.com/labring/FastGPT/main/projects/app/data/config.json

# pgvector 版本(测试推荐，简单快捷)
curl -o docker-compose.yml https://raw.githubusercontent.com/labring/FastGPT/main/deploy/docker/docker-compose-pgvector.yml
```

### 2.2 启动容器

#### 2.2.1 配置 yaml 文件（pgvector）

成功下载 `config.json`、`docker-compose.yml` 文件

![文件下载成功](/images/fastgpt/file-download-success.webp)

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


#### 2.2.2 运行容器

```bash
cd fastgpt

# 启动容器
docker-compose up -d

# 关闭容器
docker-compose down
```

![容器启动成功](/images/fastgpt/container-startup.webp)

#### 2.2.3 检查容器状态

![容器状态检查](/images/fastgpt/container-status.webp)

### 2.3 测试访问地址

::: tip 访问信息
- **访问地址**: [http://192.168.1.126:3000/login](http://192.168.1.126:3000/login)
- **登录账号**: root/ruoyi-ai@lindaxia
:::

成功登录！

![登录成功界面](/images/fastgpt/login-success.webp)

## 三、配置 FastGPT

### 3.1 模型配置

我选择了 **[PPIO欧派云]** 模型商进行测试：

::: info 参考文档
- 接入参考文档：[https://ppio.cn/docs/third-party/fastgpt-use](https://ppio.cn/docs/third-party/fastgpt-use)
- 官方文档：[https://ppio.cn/model-api/console](https://ppio.cn/model-api/console)
:::

![PPIO 模型商界面](/images/fastgpt/ppio-interface.webp)

#### 3.1.1 索引模型（qwen/qwen3-embedding-8b）

![索引模型配置](/images/fastgpt/index-model-config.webp)

点击“新增模型”，配置好模型参数，点击“确定”

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


![模型配置界面](/images/fastgpt/model-config-interface.webp)

点击“模型测试”通过

![模型测试通过](/images/fastgpt/model-test-pass.webp)

#### 3.1.2 语言模型

![语言模型配置](/images/fastgpt/language-model-config.webp)

点击“新增模型”，配置好模型参数，点击“确定”

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


![语言模型配置界面](/images/fastgpt/language-model-interface.webp)

点击“模型测试”通过

![语言模型测试通过](/images/fastgpt/language-model-test.webp)

### 3.2 新增知识库

![知识库创建](/images/fastgpt/knowledge-base-create.webp)

**分块详情**

![分块详情配置](/images/fastgpt/chunk-details.webp)

**新建成功**

![知识库创建成功](/images/fastgpt/knowledge-base-success.webp)

### 3.3 创建简易应用（AMD产品智能客服示例）

![应用创建界面](/images/fastgpt/app-create-interface.webp)

**AI 配置**

![AI 配置界面](/images/fastgpt/ai-config-interface.webp)

**调试预览示例**: AMD9334 是 AMD ZEN4 产品的么？

![调试预览结果](/images/fastgpt/debug-preview.webp)

**保存应用**

![应用保存成功](/images/fastgpt/app-save-success.webp)

### 3.4 发布渠道（外部调用 API）

创建 FastGPT 应用 API 访问的 key

![API Key 创建](/images/fastgpt/api-key-create.webp)

## 四、项目接入 FastGPT 对话

### 4.1 环境准备

::: tip 前置条件
ruoyi-ai、ruoyi-admin、ruoyi-web 服务正常运行，部署教程省略～
:::

### 4.2 ruoyi-admin 端配置系统模型

成功登录：[http://localhost:5666/operate/model](http://localhost:5666/operate/model)

在系统模型页配置 FastGPT 模型分类！

![系统模型配置](/images/fastgpt/system-model-config.webp)

**配置详情**

![模型配置详情](/images/fastgpt/model-config-details.webp)

### 4.3 ruoyi-web 端进行对话

成功登录：[http://localhost:1002](http://localhost:1002)

#### 4.3.1 配置模型切换

::: warning 注意
这里模型为 admin 端配置的模型描述，是个小 bug，后续优化
:::

![模型切换配置](/images/fastgpt/model-switch-config.webp)

#### 4.3.2 提问测试

**测试问题示例**：
- Ryzen 9 7950X 的最大加速频率是多少
- AMD PRO 商用平台技术包括哪些

![对话测试结果](/images/fastgpt/chat-test-result.webp)

::: tip 说明
当前在 ruoyi-web 响应结构需要优化，当前教程重在演示集成 FastGPT 操作步骤！
:::

### 4.4 检查 FastGPT 端日志记录

登录 [http://192.168.1.126:3000/](http://192.168.1.126:3000/)，查看对话日志，成功接入调用 FastGPT 端

![FastGPT 日志记录](/images/fastgpt/fastgpt-logs.webp)

## 五、接入 FastGPT 源码说明

在 ruoyi-ai 项目 master 分支中已经合并了开发提的 pr，在此感谢开发者 @龙卷风 对 ruoyi-ai 项目的大力支持！🙏

![源码贡献记录](/images/fastgpt/source-contribution.webp)



