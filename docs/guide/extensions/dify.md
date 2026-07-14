# Dify 集成

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

::: tip Dify 简介
Dify 是一个开源的 LLM 应用开发平台，支持可视化编排提示词、知识库、工作流和 Agent。RuoYi AI 把已发布到 API 的 Dify 应用当作一个**模型服务商（provider）**接入，前端选这个模型聊天时，请求会被转发到对应的 Dify 应用。也就是说，你在 Dify 里编排好的应用，在 RuoYi AI 这边就是一个可调用的"模型"。
:::

## 一、Dify 端准备应用

1. 登录 [Dify 官网](https://dify.ai)（或自建 Dify 实例），创建一个应用。
   ![alt text](/images/dify/dify-01.webp)
2. 检查模型设置，配置自己的密钥信息。
   ![alt text](/images/dify/dify-02.webp)
   ![alt text](/images/dify/dify-03.webp)
3. 发布完成后，点击「访问 API」。
   ![alt text](/images/dify/dify-04.webp)
4. 创建 API 密钥，复制保存 `app-` 开头的 **App API Key**，后面要用。
   ![alt text](/images/dify/dify-05.webp)

## 二、执行预置 SQL

RuoYi AI 在 `docs/script/sql/update/update-0707-dify-provider.sql` 提供了预置脚本，会向 `chat_provider` 表插入 `dify` 厂商、向 `chat_model` 表插入一条示例模型。脚本带 `ON DUPLICATE KEY UPDATE`，可重复执行。

::: warning 地址区分
- 官方 Dify：`https://api.dify.ai/v1`
- 自建 Dify：填你自己的访问地址，例如 `https://your-dify-host/v1`，结尾保留 `/v1`。
:::

字段对照：

| 数据库字段 | 含义 | Dify 示例值 |
| --- | --- | --- |
| `provider_code` | 服务工厂路由键 | `dify` |
| `api_host` | Dify API 地址 | `https://api.dify.ai/v1` |
| `model_name` | RuoYi 侧展示名（非 Dify 模型名） | `dify-chat` |
| `api_key` | Dify App API Key | `app-xxxxxxxx` |

## 三、后台模型管理核对

进入 **系统管理 → 模型管理**，确认 `dify` 厂商与示例模型已存在，并把示例里的占位值改成你自己的：

- **API Host**：按官方/自建填写，保留 `/v1`。
- **API Key**：替换为第一步创建的 Dify App API Key。
- **模型名称**：仅作展示，可改成你的应用名，不影响调用。

![alt text](/images/dify/dify-06.webp)

## 四、效果验证

在前端选择该 Dify 模型发起对话，确认能正常流式返回。

![alt text](/images/dify/dify-07.webp)

::: tip 多轮上下文
Dify 的 chat 接口只接收一个 `query` 字段，RuoYi AI 会把会话上下文（系统提示、历史消息、当前提问）拼接成一段文本作为 `query` 传入，并把登录用户 ID 作为 Dify 的 `user` 字段，便于 Dify 端做用量统计与隔离。
:::

## 五、实现说明

接入实现位于 `ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/service/chat/impl/provider/DifyChatServiceImpl.java`：

- 依赖 `io.github.imfangs:dify-java-client`，通过 `DifyClientFactory.createChatClient` 构建客户端。
- 实现 langchain4j 的 `StreamingChatModel` 与 `ChatModel`，把 Dify 的 SSE 事件（`message` / `agent_message` / `message_end` / `error`）翻译回 langchain4j 的 `onPartialResponse / onCompleteResponse / onError`，上层 SSE 与消息落库逻辑无需改动。
- 流式与阻塞两种模式都支持，因此**深度思考模式**下的多 Agent Supervisor 也能用 Dify 当 planner 模型。
- `message_replace` 事件因 SSE 通道不支持替换已发送内容，仅用于最终消息落库。
