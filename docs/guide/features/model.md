# 模型管理

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 概览

模型管理负责把不同厂商、不同能力类型的模型统一配置到 RuoYi AI 中。当前实现以 `ruoyi-chat` 模块为核心，后台接口位于 `/system/model`，模型调用通过 `ChatModeType` 和 `ModelType` 区分厂商与能力。

```text
厂商管理
  -> 模型配置
  -> 模型分类
  -> 服务工厂
  -> 对话、知识库、智能体、多模态、工作流
```

## 模型分类

`ModelType` 定义了 RuoYi AI 中的模型用途。新增模型时应先确认分类，再选择对应厂商和服务实现。

| 分类 | 标识 | 用途 |
| --- | --- | --- |
| 聊天模型 | `chat` | 对话、智能体推理、工作流 LLM 节点。 |
| 图片识别/生成 | `image` | 图像理解、文生图、图像任务。 |
| 向量模型 | `vector` | 知识库文档向量化、查询向量化。 |
| 重排模型 | `reranker` | 对召回片段重新排序，提高相关性。 |
| 语音生成 | `audio` | 文本转语音。 |
| 语音转文本 | `text` | 语音识别，预留扩展。 |
| 文生视频 | `video` | 文本生成视频、视频任务查询。 |
| 文生 PPT | `ppt` | 预留。 |
| 文生音乐 | `music` | 预留。 |

## 多厂商接入

当前 `ChatModeType` 已覆盖以下厂商：

| 厂商编码 | 说明 | 常见用途 |
| --- | --- | --- |
| `openai` | OpenAI 及兼容接口 | 聊天、图片、音频、视频。 |
| `deepseek` | DeepSeek | 聊天、推理类任务。 |
| `qianwen` | 通义千问/百炼 | 聊天、向量、多模态、重排。 |
| `zhipu` | 智谱 AI | 聊天、向量、重排。 |
| `ollama` | 本地模型服务 | 内网、离线、私有化部署。 |
| `minimax` | MiniMax | 聊天、向量等。 |
| `atlas` | Atlas Cloud | 图片、视频生成。 |
| `xiaomi` | 小米 MiMo | 预留/扩展。 |
| `dify` | Dify 应用 API | 把编排好的 Dify 应用当聊天模型调用。 |
| `coze` | Coze Bot API | 把已发布的 Coze Bot 当聊天模型调用。 |
| `custom_api` | 自定义 OpenAI-compatible API | 接入第三方网关或私有模型服务。 |

截图占位：厂商列表页，建议放置在 `/images/model/provider-list.webp`。

## OpenAI-compatible 接口

RuoYi AI 推荐将兼容 OpenAI 协议的厂商统一走 `custom_api` 或对应厂商实现。最小配置包括：

| 参数 | 说明 | 示例 |
| --- | --- | --- |
| 模型名称 | 调用时传入的模型 ID | `deepseek-chat`、`gpt-4.1-mini` |
| API Host | 服务地址 | `https://api.deepseek.com` |
| API Key | 鉴权密钥 | `sk-***` |
| 模型分类 | 用途 | `chat`、`vector`、`image` |
| 厂商编码 | 服务工厂路由 | `deepseek`、`openai`、`custom_api` |

::: tip DeepSeek
DeepSeek 提供 OpenAI-compatible API。配置时可将厂商选为 DeepSeek，也可以通过自定义 API 方式填写兼容地址。
:::

::: tip OpenAI
OpenAI 模型可按能力拆分为聊天、图像、音频、视频等分类。不要把同一个模型配置复用于不匹配的分类，否则多模态接口会提示分类不匹配。
:::

## 后台操作

### 新增模型

1. 进入 **系统管理 -> 模型管理**。
2. 点击 **新增**。
3. 选择厂商编码与模型分类。
4. 填写模型名称、API Host、API Key。
5. 保存后在对话、知识库或媒体生成页面选择该模型。

截图占位：新增模型表单，建议放置在 `/images/model/model-create.webp`。

### 获取厂商选项

后台通过 `/system/model/providerOptions` 返回厂商枚举，前端可直接用于下拉选择。

```http
GET /system/model/providerOptions
```

### 用户可用模型列表

普通对话侧通过 `/system/model/modelList` 获取模型列表，未指定分类时默认返回聊天模型。

```http
GET /system/model/modelList?category=chat
```

## 多平台集成

平台集成属于模型管理的外部平台接入能力。与普通模型不同，Dify、Coze、FastGPT 等平台通常已经包含应用编排、知识库或 Bot 配置，RuoYi AI 侧只需要维护访问地址、密钥、应用 ID 和调用参数。

| 平台 | 接入方式 | 适合场景 |
| --- | --- | --- |
| Dify | API Key + 应用接口 | 已经在 Dify 中维护工作流或聊天应用。 |
| Coze | Bot ID + 访问令牌 | 已经在扣子中配置 Bot、插件和发布渠道。 |
| FastGPT | API Key + 应用接口 | 已经在 FastGPT 中维护知识库和应用编排。 |

详细配置步骤请参考：[多平台集成](./models-platforms-integration.md)。

## 多模态能力

多模态也归属于模型管理，因为它依赖模型分类和厂商 provider 路由。当前 RuoYi AI 通过 `/media` 统一提供图片、语音、视频能力。

| 能力 | 接口 | 模型分类 |
| --- | --- | --- |
| 语音生成 | `POST /media/speech` | `audio` |
| 图片生成 | `POST /media/image` | `image` |
| 视频生成 | `POST /media/video` | `video` |
| 视频查询 | `GET /media/video` | `video` |

配置要点：

1. 在模型管理中先新增对应分类的模型。
2. 厂商编码必须能路由到对应 provider。
3. 调用媒体接口时，模型分类必须匹配，否则会提示分类不匹配。

详细说明请参考：[多模态能力](./multimodal.md)。

## 接入 PPIO 派欧云

### 1. 获取API密钥

访问 [PPIO派欧云官网](https://ppio.cn)，登录后点击右上角控制台，进入《账号管理》→《API 密钥管理》创建密钥。

![获取API密钥](/images/model/mode-01.webp)

### 2. 选择模型

在模型广场选择一个模型。

![模型广场](/images/model/mode-02.webp)

### 3. 后台配置

在管理后台的模型管理中配置模型信息。

![后台模型配置](/images/model/mode-03.webp)

### 4. 效果展示

配置完成后即可在对话中使用。

![效果展示](/images/model/mode-04.webp)

## 支持厂商列表

![支持厂商列表](/images/model/mode-05.webp)

## 自定义模型 - 需支持OPENAI兼容格式

支持添加自定义厂商接入。

![自定义厂商](/images/model/mode-06.webp)

## 扩展新厂商

新增厂商建议按以下顺序处理：

1. 在 `ChatModeType` 中增加厂商编码和描述。
2. 新增对应的模型服务实现，例如 `XxxServiceImpl`。
3. 将服务注册到对应工厂，保证 `providerCode` 能路由到实现类。
4. 如涉及向量、重排、图像、视频或音频，补充对应 provider。
5. 在后台新增厂商图标、默认 API Host 和配置说明。

截图占位：厂商扩展配置页，建议放置在 `/images/model/provider-create.webp`。

## 参考资料

- [LangChain4j Models](https://docs.langchain4j.dev/category/models)
- [DeepSeek API Docs](https://api-docs.deepseek.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)

