---
outline: deep
---

# 使用知识库

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 工作原理

知识库的工作流程如下图所示：

![知识库执行原理图](/images/knowledge/kn-05.png)

用户提问后，系统会先将问题转换为向量，在向量库中检索相关文档块，再将检索结果注入上下文，最终由 LLM 生成回答。

## 在线配置（推荐）

### 第一步：配置向量模型

1. 登录后台管理系统 
配置向量类型的模型 
2. 进入 **对话管理 → 模型管理**
3. 新增向量模型配置
![配置向量模型](/images/knowledge/kn-06.png)
**配置参数说明：**

| 参数 | 说明 | 示例值                 |
|------|------|---------------------|
| 模型名称 | 向量模型名称 | `baai/bge-m3`            |
| API Host | API 服务地址 | `https://ppio.com/` |
| API Key | API 密钥 | `控制台-管理API密钥中获取`    |



### 第二步：安装向量库

#### 方案一：Milvus(推荐)

::: info 向量库
向量库用于存储文档的向量表示，支持快速相似度检索。目前支持 **Weaviate** 和 **Milvus** 两种方案。
- Milvus 是一款高性能开源向量数据库，专为海量向量数据的存储、索引和检索而设计，适合大规模生产环境。
- Weaviate 是一款轻量级向量数据库，安装简单、资源占用低，非常适合入门学习和中小型项目。
:::

**Docker Compose 安装：**

在 `script/docker/milvus` 目录下执行：

```bash
# 启动 Milvus
docker-compose up -d
```

**docker-compose.yml 配置参考：**

```yaml
version: '3.5'

services:
   etcd:
      container_name: milvus-etcd
      image: quay.io/coreos/etcd:v3.5.18
      environment:
         - ETCD_AUTO_COMPACTION_MODE=revision
         - ETCD_AUTO_COMPACTION_RETENTION=1000
         - ETCD_QUOTA_BACKEND_BYTES=4294967296
         - ETCD_SNAPSHOT_COUNT=50000
      volumes:
         - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/etcd:/etcd
      command: etcd -advertise-client-urls=http://etcd:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
      healthcheck:
         test: ["CMD", "etcdctl", "endpoint", "health"]
         interval: 30s
         timeout: 20s
         retries: 3

   minio:
      container_name: milvus-minio
      image: minio/minio:RELEASE.2023-03-20T20-16-18Z
      environment:
         MINIO_ACCESS_KEY: minioadmin
         MINIO_SECRET_KEY: minioadmin
      ports:
         - "9001:9001"
         - "9000:9000"
      volumes:
         - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/minio:/minio_data
      command: minio server /minio_data --console-address ":9001"
      healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
         interval: 30s
         timeout: 20s
         retries: 3

   standalone:
      container_name: milvus-standalone
      image: milvusdb/milvus:v2.5.7
      command: ["milvus", "run", "standalone"]
      security_opt:
         - seccomp:unconfined
      environment:
         ETCD_ENDPOINTS: etcd:2379
         MINIO_ADDRESS: minio:9000
      volumes:
         - ${DOCKER_VOLUME_DIRECTORY:-.}/volumes/milvus:/var/lib/milvus
      healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:9091/healthz"]
         interval: 30s
         start_period: 90s
         timeout: 20s
         retries: 3
      ports:
         - "19530:19530"
         - "9091:9091"
      depends_on:
         - "etcd"
         - "minio"

   attu:
      container_name: attu
      image: zilliz/attu:v2.5.7
      environment:
         MILVUS_URL: milvus-standalone:19530
      ports:
         - "19500:3000"  # 外部端口19500可以自定义
      depends_on:
         - "standalone"

networks:
   default:
      name: milvus
```

**验证安装：**
![Milvus 安装成功](/images/knowledge/kn-07.png)

默认集成了Attu图形化管理工具,访问http://localhost:19500/
默认用户名密码: root/Milvus
![Attu登录界面](/images/knowledge/kn-08.png)
访问主页
![Attu主界面](/images/knowledge/kn-09.png)

#### 方案二：Weaviate

在 `script/docker/weaviate` 目录下执行：

```bash
docker-compose up -d
```

**docker-compose.yml 配置参考：**

```yaml
services:
  weaviate:
    command:
      - --host
      - 0.0.0.0
      - --port
      - '6038'
      - --scheme
      - http
    image: semitechnologies/weaviate:1.19.7
    ports:
      - 6038:6038
      - 50051:50051
    volumes:
      - weaviate_data:/var/lib/weaviate
    restart: on-failure:0
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'none'
      ENABLE_MODULES: 'text2vec-cohere,text2vec-huggingface,text2vec-palm,text2vec-openai,generative-openai,generative-cohere,generative-palm,ref2vec-centroid,reranker-cohere,qna-openai'
      CLUSTER_HOSTNAME: 'node1'
volumes:
  weaviate_data:
```

**验证安装：**

```bash
docker images
```

![Weaviate 安装成功](/images/knowledge/kn-00.png)

### 第三步：创建知识库

完成模型配置后，即可创建知识库。

1. 进入 **对话管理 → 知识管理 → 新增知识**
2. 配置知识库参数

![创建知识库](/images/knowledge/kn-02.png)

**关键参数说明：**

| 参数 | 说明                                                    |
|------|-------------------------------------------------------|
| **分隔符** | 知识块分割规则，默认根据设置中的文本块大小进行分类。如果设置了分隔符，则分隔符包裹的文本会被单独分为一块。 |
| **检索条数** | 检索时返回的文本块数量。如设置为 3，则将符合条件的前 3 个文本块带入上下文。              |
| **重叠字符数** | 上一个文本块和下一个文本块重复的字数，提高检索连贯性。                           |
| **向量模型** | 用于文本向量化的模型，推荐使用 `bge-m3`。                             |

### 第四步：上传附件
1. **知识库列表 → 附件 → 文件上传**
![创建知识库](/images/knowledge/kn-13.png)




**文件内容：**

```txt
RUOYI-AI企业级AI助手平台
开箱即用的全栈AI平台，支持多智能体协同、Supervisor模式编排、多种决策模型，提供先进的RAG技术和可视化流程编排能力

RUOYI-AI核心亮点
模块	现有能力	扩展方向
模型管理	多模型接入(OpenAI/DeepSeek/通义/智谱)、多模态理解、Coze/DIFY/FastGPT平台集成	自动模式、容错机制
知识库	本地RAG + 向量库(Milvus/Weaviate) + 知识图谱 + 文档解析 +重排序	音频视频解析、知识出处
工具管理	Mcp协议集成、Skills能力 + 可扩展工具生态	工具插件市场、toolAgent自动加载工具
流程编排	可视化工作流设计器、节点拖拽编排、SSE流式执行,目前已经支持模型调用,邮件发送,人工审核等节点	更多节点类型
多智能体	基于Langchain4j的Agent框架、Supervisor模式编排,支持多种决策模型	智能体可配置
AI编程	智能代码分析、项目脚手架生成、Copilot助手	代码生成优化

RUOYI-AI快速体验
在线演示
平台	地址	账号
用户端	web.pandarobot.chat	admin / admin123
管理后台	admin.pandarobot.chat	admin / admin123
```
### 第三步：使用知识库
---
1. **启动前端项目 → 选择知识库**
![选择知识库](/images/knowledge/kn-14.png)
2. **开始对话**
![开始对话](/images/knowledge/kn-15.png)
## 本地安装
本地安装需要先部署本地llm模型和向量模型，适合内网环境或对数据隐私有要求的场景。

### 第一步：安装向量模型

#### 安装 Ollama

1. **下载 Ollama**

   访问 [Ollama 官方仓库](https://github.com/ollama/ollama?tab=readme-ov-file) 下载对应平台的安装包。

2. **拉取向量模型**

   ```bash
   ollama pull quentinz/bge-large-zh-v1.5
   ```

3. **验证安装**

   ```bash
   ollama list
   ```

![向量模型环境检测](/images/knowledge/kn-01.png)

#### 后台配置向量模型


安装完成后，需要在后台管理界面配置本地向量模型：

1. 进入 **对话管理 → 模型管理**
2. 新增向量模型配置
![配置本地向量模型](/images/knowledge/kn-11.png)

| 参数 | 说明          | 示例值 |
|------|-------------|--------|
| 模型名称 | 本地向量模型      | `quentinz/bge-large-zh-v1.5` |
| API Host | Ollama 服务地址 | `http://127.0.0.1:11434` |
| API Key | 可随意配置       | `sk-xx` |

### 第三步：配置 LLM 模型

本地安装同样推荐使用 Ollama 运行开源大语言模型。

#### 拉取并运行 LLM 模型

1. **拉取模型**

   ```bash
   ollama pull qwen2.5:7b
   ```

2. **运行模型**

   ```bash
   ollama run qwen2.5:7b
   ```

#### Ollama 常用指令

| 指令 | 说明 |
|------|------|
| `ollama -v` | 查看版本 |
| `ollama serve` | 启动服务 |
| `ollama list` | 查看已安装模型列表 |
| `ollama pull <model>:<tag>` | 拉取模型 |
| `ollama run <model>:<tag>` | 运行模型 |
| `ollama rm <model>:<tag>` | 删除模型 |

::: tip 模型资源

Ollama 支持的模型列表请查看：https://ollama.com/library

:::

#### 后台配置 LLM 模型

1. 进入 **对话管理 → 模型管理**
2. 新增 LLM 模型配置

**配置参数：**
![配置本地llm模型](/images/knowledge/kn-10.png)

| 参数 | 说明 | 示例值 |
|------|------|--------|
| 模型名称 | 本地 LLM 模型 | `ollama-qwen2.5:7b` |
| API Host | Ollama 服务地址 | `http://127.0.0.1:11434` |
| API Key | 可随意配置 | `sk-xx` |

## 视频教程

扫描下方二维码观看视频教程：

<img src="/images/knowledge/kn-12.png" alt="视频教程二维码" style="max-width: 280px; width: 100%;"> 
