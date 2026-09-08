---
outline: deep
---

# FastGPT Integration {#fastgpt-接入}

RuoYi AI has no dedicated FastGPT Java provider. Connect a published FastGPT application through `custom_api` as an OpenAI-compatible Chat Completions service.

::: warning Integration scope
This calls the application's chat API. It does not import FastGPT knowledge bases, workflows, or administration pages. Retrieval and orchestration continue inside FastGPT.
:::

## Prerequisites {#需要提前准备}

- A reachable FastGPT instance.
- A published application already tested in FastGPT.
- An API key and application App ID.
- A FastGPT address reachable from the RuoYi backend process.

For self-hosting, follow the [official documentation](https://doc.fastgpt.io/) matching your FastGPT version. Verify its health and application chat before connecting RuoYi AI.

## 1. Obtain the App ID and API key {#_1-获取-app-id-和-api-key}

1. Open the target FastGPT application.
2. Get its App ID from application details or the page path.
3. Create an API key with the required scope.
4. Keep the key out of Git, screenshots, and frontend environment variables.

See FastGPT's [chat API documentation](https://doc.fastgpt.io/zh-CN/openapi/chat).

## 2. Call FastGPT directly {#_2-先直接调用-fastgpt}

The integration in the Chinese guide uses `/api/v1/chat/completions`. FastGPT's compatibility path accepts `<apiKey>-<appId>` as the Bearer token for callers with only OpenAI SDK settings.

```bash
curl https://fastgpt.example.com/api/v1/chat/completions \
  -H "Authorization: Bearer <FASTGPT_API_KEY>-<APP_ID>" \
  -H "Content-Type: application/json" \
  -d '{"model":"fastgpt-app","stream":true,"messages":[{"role":"user","content":"只回复 OK"}]}'
```

Verify HTTP 200, SSE for a streaming request, content from the correct application, and no application-permission, model, or knowledge-base errors in FastGPT logs.

## 3. Add the model in RuoYi AI {#_3-在-ruoyi-ai-新增模型}

Open **Chat Management → Model Management → Add**.

First set `CUSTOM_OPENAI_FASTGPT_BASE_URL=https://fastgpt.example.com/api/v1` and `CUSTOM_OPENAI_FASTGPT_API_KEY=<FASTGPT_API_KEY>-<APP_ID>` in the backend's startup environment, replacing the domain and credentials, then restart Java. See [Platform credential setup](../features/models-platforms-integration.md#prepare-fastgpt) for the PowerShell example.

| Field | Value |
| --- | --- |
| Provider | `custom_api` |
| Category | Chat |
| Model name | `fastgpt-app`; FastGPT application orchestration selects the actual model |
| Description | A recognizable application name |
| Base URL | `https://fastgpt.example.com/api/v1`, matching the paired environment variable |
| Key | `env:CUSTOM_OPENAI_FASTGPT_API_KEY`; the form stores only the reference |

Use an HTTPS base URL without `/chat/completions`; the LangChain4j OpenAI client appends it. Current save rules reject HTTP and plaintext keys. The address must be reachable by the backend and match its paired credential configuration; see [Model Management](../features/model.md).

::: danger Application selection in the key
Generic `custom_api` cannot add FastGPT's `appId` to the request body. Store the combined `<apiKey>-<appId>` value in the backend environment and put only its `env:` reference in the form. If your FastGPT version lacks this format, a dedicated provider is required; the admin fields alone cannot supply the missing request property.
:::

## 4. Verify in RuoYi AI {#_4-在-ruoyi-ai-验证}

1. Open the user chat page.
2. Use ordinary model chat without an agent, knowledge base, or workflow.
3. Select the FastGPT model.
4. Send a fixed, short question.
5. Verify SSE from `/chat/send` and that the reply remains after refresh.
6. Bind it to an agent only after ordinary chat works, if appropriate.

The Supervisor uses a blocking model interface. If streaming chat works but an agent fails, check non-streaming Chat Completions compatibility and whether that FastGPT application can act as a planning model.

## Troubleshooting {#常见问题}

| Symptom | Check |
| --- | --- |
| 401 / 403 | Key validity, application permissions, combined Key-AppId format |
| 404 | Duplicated `/chat/completions` suffix or a different API base path |
| Missing appId | Use `<apiKey>-<appId>` |
| Reply from the wrong application | App ID and key association |
| Delayed streamed text | Proxy buffering, gateway configuration, FastGPT logs |
| `model` has no effect | FastGPT application orchestration selects its model |

See [Platform Integration](/en/guide/features/models-platforms-integration) for platform comparisons and RAGFlow.
