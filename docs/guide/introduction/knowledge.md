---
outline: deep
---

# 本地知识库

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 环境准备
1. 安装weaviate向量库
2. 下载ollama
3. 部署本地向量模型

### 安装向量库
 script/docker/weaviate目录下执行
```
docker-compose up -d 
```
docker-compose.yml
```
---
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
...
```
可以执行docker images检查是否成功安装
![alt text](/images/knowledge/kn-00.png)


### 安装ollama

1. 下载ollama安装包
```
https://github.com/ollama/ollama?tab=readme-ov-file

```

2. ollama拉取千问模型

```
ollama pull qwen2.5:7b
```

3. 运行大模型  

```
ollama run qwen2.5:7b 
```

4. ollama基础指令
- 查看版本 ollama-v
- 启动 ollama serve
- 查看LLM列表 ollama list
- 拉取LLM ollama pull model:scale
- 运行LLM ollama run model:scale
- 删除LLM ollama rm model:scale
- 支持模型列表 https://ollama.com/library

### 安装向量模型
1. 拉取LLM 
```
ollama pull quentinz/bge-large-zh-v1.5
```

2. 检测环境
![alt text](/images/knowledge/kn-01.png)

### 创建知识库
应用中心-知识库-立即体验
![alt text](/images/knowledge/kn-02.png)

关键参数说明
- 分隔符：知识块分割规则,默认根据设置中的文本块大小进行分类，如果设置了分割符,则分割符包裹的文本会被单独分为一块
- 检索条数, 如检索条数设置为3,则在回复时会将符合条件的前3个文本块带入上下文
- 重叠字符数，上一个文本块和下一个文本块重复的字数
- 将知识块转换为向量后存储的向量库,推荐使用weaviate
- 提问分割符：用于切割提示词内容,目前不生效，可不配置。
- 向量模型,默认使用openai的text-embedding-3-small模型,使用前需要
在chat_config中配置apiKey和apiHost,否则会在创建知识库时提示401。
也可以使用本地模型bge-large-zh-v1.5,对电脑内存要求较高,推荐使用text-embedding-3-small。

### 知识库提问
![alt text](/images/knowledge/kn-03.png)
![alt text](/images/knowledge/kn-04.png)

::: info 配置本地模型

如果想使用ollama中的本地模型,可以在模型中配置ollama-qwen2.5:7b,apihost设置成ollama运行地址,
默认是: ```127.0.0.1:11434/```,apikey可随意配置,默认sk-xx,发起请求时，后台会自动解析并且请求
ollama中的qwen2.5:7b模型。

:::

