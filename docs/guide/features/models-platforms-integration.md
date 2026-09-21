---
outline: deep
pageClass: platforms-guide
---

# 模型与外部平台接入

RuoYi AI 可通过兼容接口接入 **FastGPT、RAGFlow**，以及其他提供 **OpenAI Chat Completions** 或 **Anthropic Messages** 接口的平台。项目也提供 **Dify、Coze（扣子）** 的专用适配代码，在模型管理中直接填写对应应用的 Key 即可配置。

## 支持的平台与接入方式 {#supported-platforms}

先找到你使用的平台，确认接口类型，再阅读对应的配置步骤：

| 平台 / 服务 | 接入方式与当前条件 | 配置步骤 |
| --- | --- | --- |
| **FastGPT** | 使用 OpenAI 兼容接口，选择 `custom_api`；通过应用 API Key 与 App ID 指定应用。 | [准备 FastGPT 应用](#prepare-fastgpt) → [添加模型](#configure-model)。 |
| **RAGFlow** | 使用聊天助手的 OpenAI 兼容接口，选择 `custom_api`；请求地址中包含 Chat ID。 | [RAGFlow 接入](#ragflow)。 |
| **Dify** | 使用 Dify App API，厂商编码为 `dify`；选择该厂商并直接填写对应应用的 Key。 | [Dify 接入](#dify)。 |
| **Coze / 扣子** | 使用 Coze Bot API，厂商编码为 `coze`；选择该厂商并直接填写对应应用的 Key。 | [Coze 接入](#coze)。 |
| **其他 OpenAI 兼容平台** | 选择 `custom_api`，使用目标服务提供的地址、模型名与凭据；需确认接口兼容。 | [选择协议](#configure-provider) → [添加模型](#configure-model)。 |
| **Anthropic 兼容服务** | 选择 `custom_anthropic`，调用 Messages 接口；需确认接口兼容。 | [Anthropic 兼容服务接入](#anthropic-platforms)。 |

接入后，外部应用会成为用户端的一个模型选项。应用使用的知识库、提示词和编排仍在外部平台维护，RuoYi AI 负责对话入口、模型选择和本地会话记录。如果你要直接配置 DeepSeek、PPIO 等模型服务，可以先看[模型管理](./model.md)。

下面先介绍共用的厂商与模型配置入口，以 **FastGPT** 演示完整流程，再分别说明 **RAGFlow、Anthropic 兼容服务、Dify 和 Coze** 的配置差异。首次接入可从第 1 节开始；已有运行环境时，直接点击上表中的平台链接。

本页截图来自本地实际运行的管理端和用户端。FastGPT 表单使用示例地址演示填写方式，未提交保存；用户端截图展示已有模型的选择入口。外部平台的调用结果需要使用你的应用和凭据按第 5 节验证。

## 1. 启动管理端，找到配置入口 {#start-admin}

先按[本地安装与启动](../getting-started/install.md)启动后端，再在管理端项目中执行：

```powershell
Set-Location D:\Project\github\ruoyi-admin
pnpm install
pnpm run dev:antd
```

项目路径替换为你的实际目录，已经安装依赖时可以跳过 `pnpm install`。打开终端显示的地址，默认是 [http://localhost:5666](http://localhost:5666)，登录后展开左侧的 **对话管理**。

接下来会用到两个页面：**厂商管理**决定使用哪一种接口协议，**模型管理**填写具体应用的地址、模型名和API Key。两者需要连接同一个后端；当前管理端开发代理默认指向 `http://127.0.0.1:6039`。

如果刚升级了自定义协议功能，请先重新构建并启动更新后的后端与管理端，再进行下面的配置。

## 2. 在厂商管理中选择接入协议 {#configure-provider}

### 2.1 先确认你的平台提供什么接口

打开 **对话管理 → 厂商管理**，先检查是否已有需要的厂商。已有记录直接使用，没有时再点 **新增**。

![运行中的厂商管理列表，可查看厂商编码、API 地址和状态](/images/platforms/provider-list.png)

厂商名称用于识别服务，厂商编码用于选择后端的接入实现。以 FastGPT 为例，它提供 OpenAI 兼容接口，所以可以使用 `custom_api`。不需要为了显示“FastGPT”而另造一个厂商编码，具体应用可以在模型描述里命名。

| 平台提供的接口 | 选择的厂商编码 | 后端发送请求的方式 |
| --- | --- | --- |
| OpenAI Chat Completions 兼容接口，例如 FastGPT、RAGFlow 的兼容接口 | 自定义 OpenAI，`custom_api` | Bearer 鉴权，调用 `/chat/completions` |
| Anthropic Messages 兼容接口 | 自定义 Anthropic，`custom_anthropic` | `x-api-key` 鉴权，调用 `/messages` |
| Dify App API、Coze Bot API | 专用适配，见[第 6 节](#native-platforms) | 选择对应厂商，在模型管理中填写应用 Key。 |

::: tip 使用旧数据时

已有的 `custom_api` 记录可能仍叫“自定义厂商”，截图中也是这个名称。查看编码即可确认协议，无需重新创建。列表里存在 Dify、Coze 记录也不代表已经能调用，继续之前请先阅读[当前接入条件](#native-platforms)。

:::

### 2.2 添加或检查厂商

在新增表单的 **厂商编码** 下拉框中选择协议。可以输入 `custom` 筛选出这两个选项。

![真实管理端新增表单中的 OpenAI 与 Anthropic 两种自定义协议](/images/platforms/provider-protocols.png)

以 OpenAI 兼容服务为例：

| 字段 | 怎么填 |
| --- | --- |
| 厂商名称 | 例如“OpenAI 兼容服务”，用于模型表单中的供应商选项。 |
| 厂商编码 | 选择 **自定义 OpenAI**，对应 `custom_api`。 |
| API 地址 | 自定义协议的实际请求地址在模型中单独填写，此处可留空。 |
| 排序 | 按需要设置，数值越小越靠前。 |
| 状态 | **启用**。停用后不能用于新的模型调用。 |
| 厂商描述、图标、备注 | 按需填写。 |

点击 **确认** 保存后，回到列表检查编码和状态。同一租户内只能有一条未删除的同编码厂商记录；如果提示编码重复，直接使用已有记录。

**多个 OpenAI 兼容平台可以共用这条厂商记录。** 例如，FastGPT 和 RAGFlow 都选择 `custom_api`，各自在模型管理中配置不同地址和API Key。选择自定义厂商时，模型表单会清空请求地址，要求你手动填写。

::: details 厂商配置如何找到接入代码

普通聊天发送到后端后，`ChatServiceFacade` 先按模型名读取配置，再用 `providerCode` 从 `ChatServiceFactory` 取得对应实现：

```java
ChatModelVo model = chatModelService.selectModelByName(chatRequest.getModel());
AbstractChatService service =
    chatServiceFactory.getOriginalService(model.getProviderCode());
```

`custom_api` 对应 `CustomApiServiceImpl`，`custom_anthropic` 对应 `CustomAnthropicServiceImpl`。这两个实现都支持完整响应和流式响应。新增数据库记录只会增加配置，不会自动生成一个新的协议适配类。

已有协议够用时，继续配置模型即可；需要编写专用实现时，见[第 8 节](#extend-provider)。

:::

## 3. 准备 FastGPT 应用和后端凭据 {#prepare-fastgpt}

### 3.1 从平台取得应用信息

先在 FastGPT 中完成自己的应用配置，确认它在平台调试页面能够回答问题，再发布需要对外使用的版本。然后准备以下信息：

| 需要的信息 | 用在什么地方 |
| --- | --- |
| 应用 App ID | 确定调用哪一个 FastGPT 应用，可从应用详情地址中取得。 |
| 有权限访问该应用的 API Key | 后端调用 FastGPT 时鉴权。 |
| 对话接口地址 | 例如 `https://fastgpt.example.com/api/v1/chat/completions`。使用你的实际 HTTPS 服务地址。 |

FastGPT 支持将鉴权值组合为 `<API_KEY>-<APP_ID>`，这样通用 OpenAI 客户端无需在请求体中另传 `appId`。FastGPT 实际使用的模型由应用编排决定，RuoYi AI 中可以把这条配置命名为 `fastgpt-app`。依据：[FastGPT 对话接口](https://doc.fastgpt.io/zh-CN/openapi/chat)。

### 3.2 在模型管理中填写地址和 Key

在 ruoyi-admin 中填写 FastGPT 服务基础地址，将 `<API_KEY>-<APP_ID>` 组合值直接填入模型密钥框。无需配置后端环境变量或重启后端。

### 3.3 先确认平台接口能够独立调用

在后端所在机器或容器的网络环境中，按平台 API 文档调用一次。这样可以先确认应用已发布、密钥有权限、地址可访问，再继续检查 RuoYi AI 配置。

::: details 使用 curl 检查 FastGPT 流式接口

下面是 **Bash / WSL / Git Bash** 示例。先在这个终端中设置与上面一致的 `CUSTOM_OPENAI_FASTGPT_BASE_URL` 和 `CUSTOM_OPENAI_FASTGPT_API_KEY`，再执行：

```bash
curl --no-buffer --fail-with-body \
  "${CUSTOM_OPENAI_FASTGPT_BASE_URL%/}/chat/completions" \
  -H "Authorization: Bearer ${CUSTOM_OPENAI_FASTGPT_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"model":"fastgpt-app","stream":true,"messages":[{"role":"user","content":"你好，请介绍这个应用的用途。"}]}'
```

正常情况下能看到连续的 `data:` 事件，内容包含回答片段，最后收到结束事件。再把 `stream` 改为 `false` 检查完整响应，确认 `choices[0].message.content` 中有回答。

如果平台提示缺少 `appId`，先核对组合凭据是否正确。若目标版本必须在 JSON 中传 `appId`，或应用依赖额外的 `variables`，当前通用配置无法直接表达这些字段，需要[扩展专用适配](#extend-provider)。

:::

## 4. 在模型管理中添加平台应用 {#configure-model}

### 4.1 确认“对话”分类已经维护

进入 **对话管理 → 模型管理 → 新增**，查看 **模型分类** 中是否有“对话”。这个选项来自字典，数据键值必须是 `chat`。

缺少选项时，先到 **系统管理 → 字典管理**，找到 **模型分类**（`chat_model_category`），在字典数据中新增 **对话 / chat**；已有记录时直接检查标签和键值。保存后刷新字典缓存，再重新打开模型表单。详细字段说明见[在字典中维护模型分类](./model.md#model-category-dict)。

可以先在左侧“字典类型”中搜索 `chat_model_category`，点击对应记录，再检查右侧字典数据。

![运行中的字典管理页面，模型分类字典包含对话标签及 chat 键值](/images/platforms/model-category-dict.png)

### 4.2 选择厂商，填写应用连接信息

回到模型新增表单，先选择第 2 节配置的供应商，再填写其余字段：

| 模型字段 | FastGPT 示例 | 填写说明 |
| --- | --- | --- |
| 供应商 | 自定义厂商，或你设置的厂商名称 | 对应编码必须是 `custom_api`，选中后应显示“接口协议：OpenAI Chat Completions”。 |
| 模型分类 | 对话 | 保存的值是 `chat`。 |
| 模型名称 | `fastgpt-app` | 在 RuoYi AI 内识别这条配置，并作为请求的 `model` 字段发送。避免与同租户其他模型重名。 |
| 模型描述 | `FastGPT 知识库助手` | 用户端优先显示这个名称，便于用户选择。 |
| 请求地址 | `https://fastgpt.example.com/api/v1` | 替换为实际服务地址。 |
| 密钥 | `<API_KEY>-<APP_ID>` | 直接填写真实组合值。 |
| 备注 | 按需填写 | 可以记录对应应用的用途。 |

![真实模型新增表单，演示 FastGPT 的协议、分类、请求地址和API Key](/images/platforms/fastgpt-model-form.png)

图中使用示例域名，表单未提交。实际保存前，请换成自己的地址，并填写真实应用 Key。

“请求地址”填写的是 **API 基础地址（Base URL）**。当前 OpenAI 客户端会在其后追加 `/chat/completions`，因此上面的配置最终请求：

```text
https://fastgpt.example.com/api/v1/chat/completions
```

自定义协议也接受完整的对应接口地址，后端会去掉末尾接口路径再交给客户端；按表格填写基础地址更容易检查。不要填平台网页控制台地址。

### 4.3 保存后检查什么

点击 **确认**，检查模型列表中是否出现 `fastgpt-app`，供应商是否正确，分类是否为“对话”。保存成功表示配置通过校验，下一步还需要实际发送消息。

检查保存的地址和应用 Key 是否正确。编辑模型时密钥留空保留原值，填写新 Key 则替换原值。

### 4.4 RAGFlow 接入 {#ragflow}

RAGFlow 使用聊天助手的 OpenAI 兼容接口，配置入口与 FastGPT 相同。先创建并调试好聊天助手，取得该助手的 **Chat ID** 和 **API Key**，再填写以下配置：

| 配置项 | RAGFlow 填写方式 |
| --- | --- |
| 厂商编码 | `custom_api`，可复用 FastGPT 使用的自定义 OpenAI 厂商记录。 |
| 模型分类 | 对话（`chat`）。 |
| 模型名称 | 按目标版本的 API 文档填写有效模型名。 |
| 请求地址 | `https://ragflow.example.com/api/v1/openai/<CHAT_ID>`。 |
| 模型中的密钥 | 服务商提供的真实 API Key。 |

将示例域名和 `<CHAT_ID>` 替换为实际值，在模型管理中填写真实 Key 并保存。最终请求路径是 `/api/v1/openai/<CHAT_ID>/chat/completions`，因此本项目的基础地址不要额外保留末尾 `/chat`。模型名和兼容路径以部署版本自带的 API 文档为准，参考 [RAGFlow OpenAI-Compatible API](https://ragflow.io/docs/http_api_reference#openai-compatible-api)。保存后按[第 5 节](#verify-chat)在用户端选择该模型验证。

### 4.5 Anthropic 兼容服务接入 {#anthropic-platforms}

先确认目标服务提供 Anthropic Messages 兼容接口，取得可用的模型 ID、API 地址和密钥。创建或启用 `custom_anthropic` 厂商，再选择它配置模型；表单应显示“接口协议：Anthropic Messages”。

| 配置项 | Anthropic 兼容服务填写方式 |
| --- | --- |
| 厂商编码 | `custom_anthropic`。 |
| 模型分类 | 对话（`chat`）。 |
| 模型名称 | 服务提供方公布的模型 ID。 |
| 请求地址 | 例如 `https://gateway.example.com/v1`，替换为实际基础地址。 |
| 模型中的密钥 | 服务商提供的真实 API Key。 |

在模型管理中填写真实 Key 并保存。后端使用 Anthropic 客户端发送 `x-api-key` 和版本请求头；示例地址最终请求 `/v1/messages`，不能把 OpenAI 的 `/chat/completions` 地址直接填到这里。完整配置与 curl 示例见[选择自定义厂商协议](./model.md#custom-provider)，用户端验证见[第 5 节](#verify-chat)。

这两类自定义协议支持 HTTP 或 HTTPS 地址。同一个协议下的不同平台共用厂商记录，各模型分别填写地址；停用这条厂商记录会同时影响其下的模型。

## 5. 到用户端选择模型并发起对话 {#verify-chat}

### 5.1 启动并登录用户端

保持后端运行，另开终端启动 `ruoyi-web`：

```powershell
Set-Location D:\Project\github\ruoyi-web
pnpm install
pnpm run dev --port 5180
```

打开 [http://localhost:5180/chat](http://localhost:5180/chat)，登录与管理端配置处于同一租户的账号。这里显式使用 `5180`，避免与本地文档站的 `5173` 冲突；端口被占用时以终端实际输出为准。用户端 `VITE_API_URL` 应指向与管理端相同的后端。

### 5.2 选择刚才配置的平台应用

1. 点击左侧 **新对话**。
2. 展开输入框左下角的模型按钮。如果当前显示智能体或工作流，先选择 **切换到模型**。
3. 找到并选择 **FastGPT 知识库助手**，确认输入框下方的模型名称已经变化。
4. 输入一个你在 FastGPT 调试页验证过的问题，再点击发送。

![实际运行的用户端模型下拉列表，入口位于输入框左下角](/images/platforms/user-model-select.png)

图中是本地已有的模型列表，用于说明选择入口；FastGPT 示例没有保存，因此不会出现在这张图中。你的配置保存后，重新展开模型列表即可加载。列表优先显示“模型描述”，描述为空时显示模型名称。

### 5.3 确认完整回答和会话记录

第一次测试先使用普通模型对话，检查以下结果：

| 检查动作 | 预期结果 |
| --- | --- |
| 发送一条短问题 | 回答逐段出现，最后正常结束。 |
| 继续追问 | 能结合本次会话上下文回答。 |
| 刷新页面，再从左侧打开会话 | 已完成的问答仍然存在。 |
| 检查外部平台的调用记录（如平台提供） | 能找到对应应用的一次调用。 |

开发者还可以打开浏览器 **Network**，检查 `POST /chat/send` 的响应。流式调用应使用 `text/event-stream`，既有回答片段，也有正常结束信号。**HTTP 200 或创建出会话都不能单独证明模型调用成功**，还要确认实际回答；如果收到错误事件或没有回答，按[故障排查](#troubleshooting)检查。

完成普通聊天验证后，再把模型用于[智能体](./agent.md)或[流程编排](./orchestration.md)。需要完整响应的调用场景还应单独验证 `ChatModel`；若涉及工具调用、结构化输出，也要检查目标平台是否支持这些能力。

::: details 前端如何把选择结果交给后端

`ModelSelect` 请求 `GET /system/model/modelList`，普通聊天默认读取 `chat` 分类。选择结果保存在 `useModelStore` 中，发送时把 `modelName` 放入 `model` 字段：

```json
{
  "model": "fastgpt-app",
  "content": "你好，请介绍这个应用的用途。"
}
```

实际请求还包含会话 ID 等字段。后端读取该模型的 `providerCode`、`apiHost` 和API Key，再调用对应客户端。用户端无需配置第三方平台的 API Key。

:::

## 6. Dify、Coze 当前怎样接入 {#native-platforms}

Dify、Coze 使用专用聊天适配器。启用对应厂商后，在模型管理中直接填写应用 API Key 或访问 Token。

### 6.1 Dify 接入 {#dify}

1. 在 Dify 创建并发布聊天应用，在应用内生成 **App API Key**，取得服务 API 地址；先用官方 API 验证应用可用。
2. 启用 `dify` 厂商，填写 `https://api.dify.ai/v1` 或自建服务 API 地址，模型名称使用本地配置名，密钥框直接填写应用 API Key。
3. 保存模型后，在用户端选择该模型，按[第 5 节](#verify-chat)验证回答、追问和会话记录。平台侧说明见 [Dify API 入门](https://docs.dify.ai/en/api-reference/guides/get-started)。

`DifyChatServiceImpl` 将当前消息和历史上下文拼成 `query`，`inputs` 固定为空对象；流式调用解析 Dify 事件，完整响应调用使用 `blocking` 模式。依赖自定义必填 `inputs` 的应用，还需要补字段映射。`message_replace` 只能影响最终保存的内容，无法替换已经发给前端的片段。

### 6.2 Coze / 扣子接入 {#coze}

1. 将 Coze Bot 发布为 API 服务，取得 **Bot ID**，并配置有聊天权限的访问 Token；先用官方 API 验证 Bot 可用。
2. 启用 `coze` 厂商，密钥框直接填写访问 Token。模型名称填写 Bot ID；中国区 Host 为 `https://api.coze.cn`，Host、Bot 和 Token 要属于同一区域。
3. 保存模型后，在用户端选择该模型，按[第 5 节](#verify-chat)验证回答、追问和会话记录。平台侧说明见[扣子 SDK 快速开始](https://docs.coze.cn/developer_guides_python_getting_started)。

`CozeChatServiceImpl` 把模型名称作为 `botID`，由 RuoYi AI 传递历史消息，设置 `autoSaveHistory=false`。完整响应模式也通过消费 Coze 的流式事件聚合答案实现。

### 6.3 两个平台共用的接入条件

两个适配器均使用模型管理中保存的 Key，不同模型可以填写不同应用或 Bot 的凭据。

不要把 Dify `/chat-messages` 或 Coze `/v3/chat` 地址直接填给 `custom_api`。如果通过网关转换协议，应先验证网关确实提供 OpenAI 或 Anthropic 兼容接口，再按本页的自定义协议流程配置。

## 7. 卡在哪一步，就从哪一步排查 {#troubleshooting}

| 遇到的现象 | 下一步检查 |
| --- | --- |
| 模型表单找不到供应商 | 在同租户的厂商管理中确认记录存在且已启用，再重新打开模型表单。 |
| “模型分类”没有“对话” | 检查 `chat_model_category` 字典中的 `chat`，刷新字典缓存和页面。 |
| 401 / 403 | 回到平台检查 Key、权限、区域和应用授权；FastGPT 还要检查 Key 与 App ID 的组合。 |
| 404 | 对照平台文档检查最终接口路径；FastGPT 通常为 `/api/v1/chat/completions`，RAGFlow 路径还包含 Chat ID。 |
| 用户端找不到模型 | 检查账号租户、模型分类是否为 `chat`、厂商是否启用，然后重新展开模型列表。 |
| 会话已创建，但没有回答 | 同时检查 `/chat/send` 的响应内容和后端日志；继续用平台 API 单独验证，区分配置、鉴权与响应解析问题。 |
| 直到结束才一次性显示回答 | 检查平台是否真正返回流式数据，以及反向代理是否缓冲 SSE。 |
| 普通聊天可用，智能体或编排失败 | 进一步验证完整响应、工具调用、结构化输出等当前场景需要的能力。 |

## 8. 平台有专用字段时，怎样扩展 {#extend-provider}

通用协议适合通过地址、模型名和标准鉴权完成的聊天调用。如果应用必须传工作流变量、额外请求头，或返回专用事件，就需要编写平台适配。可以参考[已接入的 PPIO 示例](./model.md#provider-extension)，再按下面的顺序完成：

1. 在 `ChatModeType` 中定义唯一厂商编码，实现 `AbstractChatService`，并用 `@Service` 注册。`getProviderName()` 返回同一编码，工厂会自动收集实现。
2. 实现 `buildStreamingChatModel()` 和 `buildChatModel()`，完成请求字段、鉴权、完整响应和流式事件的转换。
3. 通过 `ChatModelVo.getApiKey()` 读取模型配置中的 Key，并传递给服务客户端。
4. 在管理端 `apps/web-antd/src/views/chat/provider/options.ts` 中增加厂商选项；有专用配置字段时，继续补齐模型表单、后端字段和持久化。
5. 覆盖正常回答、鉴权失败、空响应、超时和流中断的测试，重新构建并启动后端。
6. 回到本页，从厂商配置、模型配置到用户端对话走完一遍，再验证智能体或编排中的使用。

后端适配类位于 `ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/service/chat/impl/provider/`，

<style>
.platforms-guide .vp-doc table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}

.platforms-guide .vp-doc th:first-child,
.platforms-guide .vp-doc td:first-child {
  min-width: 96px;
}

.platforms-guide .vp-doc p code,
.platforms-guide .vp-doc li code {
  overflow-wrap: anywhere;
}
</style>
