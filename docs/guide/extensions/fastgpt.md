---
outline: deep
---

# FastGPT 接入

RuoYi AI 当前没有 FastGPT 专用 Java provider。接入方式是把已发布的 FastGPT 应用当作 OpenAI-compatible Chat Completions 服务，通过 `custom_api` 调用。

::: warning 能力边界

这不是把 FastGPT 的知识库、工作流或管理页面同步进 RuoYi AI。RuoYi AI 只调用 FastGPT 应用的对话 API，知识检索和编排仍在 FastGPT 内部执行。

:::

## 需要提前准备

- 可访问的 FastGPT 实例。
- 已发布并在 FastGPT 端调试成功的应用。
- FastGPT API Key。
- 应用 App ID。
- 后端进程能访问的 FastGPT 地址。

FastGPT 部署版本变化较快，本页不复制整份第三方 Docker Compose。自建时应使用部署版本对应的[官方文档](https://doc.fastgpt.io/)，先在 FastGPT 自身完成健康检查和应用对话。

## 1. 获取 App ID 和 API Key

1. 在 FastGPT 中打开目标应用。
2. 从应用详情或页面路径取得 App ID。
3. 为该应用创建 API Key，并限制到所需权限。
4. 不要把 Key 写入 Git、截图或前端环境变量。

FastGPT 官方对话接口文档：[OpenAPI 对话接口](https://doc.fastgpt.io/zh-CN/openapi/chat)。

## 2. 先直接调用 FastGPT

当前官方接口为 `/api/v1/chat/completions`。为了兼容只支持 OpenAI SDK 配置的调用方，FastGPT 支持把 Bearer Token 写成 `<apiKey>-<appId>`。

```bash
curl https://fastgpt.example.com/api/v1/chat/completions \
  -H "Authorization: Bearer <FASTGPT_API_KEY>-<APP_ID>" \
  -H "Content-Type: application/json" \
  -d '{"model":"fastgpt-app","stream":true,"messages":[{"role":"user","content":"只回复 OK"}]}'
```

直连必须同时满足：

- HTTP 状态为 200。
- 流式请求返回 SSE，而不是代理错误页。
- 返回内容来自正确的 FastGPT 应用。
- FastGPT 日志中没有应用权限、模型或知识库错误。

## 3. 在 RuoYi AI 新增模型

进入“对话管理 → 模型管理 → 新增”。

在模型管理中直接填写 FastGPT 服务基础地址，将 `<FASTGPT_API_KEY>-<APP_ID>` 的真实组合值填入密钥框，无需配置环境变量。

| 字段 | 值 |
| --- | --- |
| 供应商 | `custom_api` |
| 模型分类 | 对话 |
| 模型名称 | `fastgpt-app`，当前 FastGPT 会由应用编排决定实际模型 |
| 模型描述 | 便于用户识别的应用名称 |
| 请求地址 | `https://fastgpt.example.com/api/v1`，替换为实际服务地址 |
| 密钥 | `<FASTGPT_API_KEY>-<APP_ID>` 的真实组合值 |

请求地址填写服务 base URL，不要追加 `/chat/completions`；OpenAI 客户端会自动追加该路径。服务地址需能被后端访问。

::: danger Key 格式

通用 `custom_api` 不能在 JSON 请求体中增加 FastGPT 的 `appId`。在模型密钥框直接填写平台支持的 `<apiKey>-<appId>` 组合值；目标版本不支持该格式时，需要专用适配器。

:::

## 4. 在 RuoYi AI 验证

1. 打开用户端聊天页。
2. 先使用普通模型对话，不绑定智能体、知识库或工作流。
3. 选择刚创建的 FastGPT 模型。
4. 发送固定短问题。
5. 确认 `/chat/send` 持续返回 SSE，回答结束后刷新页面仍能看到消息。
6. 普通对话成功后，再按需把它绑定到智能体。

Supervisor 使用阻塞模型接口。若普通流式聊天成功而智能体失败，要检查 FastGPT 的非流式完成是否与 OpenAI Chat Completions 兼容，以及所选 FastGPT 应用是否适合作为规划模型。

## 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 401 / 403 | API Key 无效、应用权限不足，或没有使用 Key-AppId 组合格式。 |
| 404 | 请求地址多写了 `/chat/completions`，或部署版本的 `/api/v1` 路径不同。 |
| 提示缺少 appId | 当前 Key 格式未包含 App ID；改用 `<apiKey>-<appId>`。 |
| 连接成功但回答来自错误应用 | App ID 错误，或 Key 绑定了另一个默认应用。 |
| 长时间无流式内容 | 反向代理缓冲 SSE；检查 Nginx、网关和 FastGPT 日志。 |
| 参数 `model` 不生效 | FastGPT 的实际模型由应用编排决定，这是平台行为。 |

更多平台对照和 RAGFlow 配置见[模型与外部平台接入](/guide/features/models-platforms-integration)。
