# Coze 集成

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

::: tip Coze 简介
Coze（扣子）是字节跳动的智能体开发平台，支持可视化编排 Bot、插件、工作流和知识库。RuoYi AI 把已发布到 API 渠道的 Coze Bot 当作一个**模型服务商（provider）**接入，前端选这个模型聊天时，请求会被转发到对应的 Coze Bot。也就是说，你在 Coze 里搭好的 Bot，在 RuoYi AI 这边就是一个可调用的"模型"。
:::

## 一、Coze 端创建 Bot

1. 访问 [扣子官网](https://www.coze.cn)（中国区）或 [Coze 海外](https://www.coze.com)（海外区），创建一个智能体。
   ![alt text](/images/coze/coze-01.webp)
2. 创建完成后，**先复制 Bot ID**（后面要用），然后点击发布。
   ![alt text](/images/coze/coze-02.webp)
3. 只勾选 **API** 渠道，然后点击发布。
   ![alt text](/images/coze/coze-03.webp)
4. 创建个人访问令牌（PAT），复制保存，后面要用。
   ![alt text](/images/coze/coze-04.webp)

## 二、执行预置 SQL

RuoYi AI 在 `docs/script/sql/update/update-0707-coze-provider.sql` 提供了预置脚本，会向 `chat_provider` 表插入 `coze` 厂商、向 `chat_model` 表插入一条示例模型。脚本带 `ON DUPLICATE KEY UPDATE`，可重复执行。

::: warning 区域与地址
- 中国区：`https://api.coze.cn`
- 海外区：`https://api.coze.com`

Bot 在哪个区创建的，就填哪个区的地址，否则会调用失败。
:::

字段对照：

| 数据库字段 | 含义 | Coze 示例值 |
| --- | --- | --- |
| `provider_code` | 服务工厂路由键 | `coze` |
| `api_host` | Coze API 地址 | `https://api.coze.cn` |
| `model_name` | **Coze Bot ID**（不是展示名） | `7400000000000xxx` |
| `api_key` | PAT 或 OAuth access token | `pat-xxxxxxxx` |

::: danger 重点
和 Dify 不同，Coze 的 `model_name` 必须填 **Bot ID**（第一步复制的那个），而不是任意展示名。填错会导致 Coze 找不到对应 Bot。
:::

## 三、后台模型管理核对

进入 **系统管理 → 模型管理**，确认 `coze` 厂商与示例模型已存在，并把示例里的占位值改成你自己的：

- **模型名称**：替换为你的 Coze Bot ID。
- **API Host**：按中国区 / 海外区填写。
- **API Key**：替换为第一步创建的 PAT（或 OAuth access token）。

![alt text](/images/coze/coze-05.webp)

## 四、效果验证

在前端选择该 Coze 模型发起对话，确认能正常流式返回。

![alt text](/images/coze/coze-06.webp)

::: tip 多轮上下文
Coze 调用关闭了服务端自动保存历史（`autoSaveHistory=false`），RuoYi AI 会把系统提示词拼成一条 `System:` 前缀的 user 消息插到最前，并把历史对话与当前提问一并传入，由 RuoYi 侧维护会话上下文。
:::

## 五、实现说明

接入实现位于 `ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/service/chat/impl/provider/CozeChatServiceImpl.java`：

- 依赖 `com.coze:coze-api`，通过 `CozeAPI.Builder().baseURL(...).auth(new TokenAuth(apiKey))` 构建客户端。
- 实现 langchain4j 的 `StreamingChatModel` 与 `ChatModel`，通过 `coze.chat().stream(...)` 阻塞迭代事件，按 `ChatEventType` 分发：`CONVERSATION_MESSAGE_DELTA` 追加片段、`CONVERSATION_CHAT_COMPLETED` 收尾、`CONVERSATION_CHAT_FAILED / ERROR` 报错。
- `model_name` 字段在代码里作为 `botID` 传入，`apiHost` 作为 baseURL，`apiKey` 作为 PAT/OAuth token。
- 流式与阻塞两种模式都支持，因此**深度思考模式**下的多 Agent Supervisor 也能用 Coze 当 planner 模型。
- 客户端用完后调用 `shutdownExecutor()` 释放线程池资源。
