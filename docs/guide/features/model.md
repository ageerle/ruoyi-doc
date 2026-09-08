---
outline: deep
---

# 模型管理

模型管理用于统一维护模型的名称、分类、服务地址和密钥引用，为对话、智能体、知识库和媒体功能提供所需模型。不同用途对应不同的模型分类，具体说明见[配置其他用途的模型](#model-categories)。

配置分为两部分：**厂商管理**确定使用哪套接入实现，以及创建模型时默认连接哪个地址；**模型管理**指定具体模型、用途和凭据。一个厂商可以配置多个模型，各模型分别保存自己的调用配置。

本页先说明厂商与模型的关系，再依次介绍管理端配置、用户端使用和常见问题排查。操作步骤以 DeepSeek 为例，并用已接入的 PPIO 说明如何扩展厂商。

开始前，请先完成[本地安装](../getting-started/install.md)，并保持后端服务运行。管理端负责配置，用户端负责对话，两者连接同一个后端。

## 1. 启动并登录管理端 {#start-admin}

在管理端项目 `ruoyi-admin` 中打开终端，执行：

```powershell
Set-Location D:\Project\github\ruoyi-admin
pnpm install
pnpm run dev:antd
```

项目目录请替换为你的实际位置；已经安装依赖时，可以直接执行启动命令。

启动后，打开终端显示的地址，默认是 [http://localhost:5666](http://localhost:5666)。使用管理账号登录，在左侧展开 **对话管理**，找到 **厂商管理** 和 **模型管理**。

接下来先进入厂商管理。模型表单中的供应商选项，就是从这里读取的。

::: details 管理端连接的是哪个后端

管理端是独立的前端项目 `ruoyi-admin`，后端项目 `ruoyi-ai` 内也有一个同名的 Java 启动模块。本节启动的是前者。

管理端开发配置默认使用 `5666` 端口，并在 `apps/web-antd/vite.config.mts` 中把 `/api` 请求转发到 `http://127.0.0.1:6039`。如果调整过后端地址，需要同步修改代理配置。

:::

## 2. 在厂商管理中配置厂商 {#configure-provider}

### 2.1 了解厂商的作用

厂商是模型服务的提供方。例如，DeepSeek 是厂商，`deepseek-v4-flash` 是它提供的一个模型。一个厂商可以提供多个模型，这些模型通常共用一套接口协议。

在 RuoYi AI 中，厂商配置主要解决两个问题：**使用哪一套接入代码，以及创建模型时默认连接哪个地址**。厂商的名称、图标和说明也会用于页面展示。

你可以先维护一份 DeepSeek 厂商资料，再为它添加多个模型。具体使用哪个模型、模型属于什么分类、如何配置 API Key，都在后面的模型管理中完成。

### 2.2 添加或编辑厂商

进入 **对话管理 → 厂商管理**。如果列表中已经有需要的厂商，直接点击 **编辑** 检查配置；如果没有，再点击 **新增**。

![厂商管理页面](/images/model/provider-list-runtime.png)

以 DeepSeek 为例，填写以下内容：

| 字段 | 填写内容 | 说明 |
| --- | --- | --- |
| 厂商名称 | `DeepSeek` | 页面上显示的名称，可以自行命名。 |
| 厂商编码 | 选择“深度求索”，对应 `deepseek` | 后端用这个编码找到 DeepSeek 的接入实现。 |
| API 地址 | `https://api.deepseek.com` | 创建模型时带入的默认地址。当前 DeepSeek 实现要求使用这个官方地址。 |
| 排序 | `0` | 数值越小越靠前；相同数值再按厂商 ID 排序。 |
| 状态 | 启用 | 只有启用的厂商才能用于模型配置和新的调用。 |
| 厂商图标、描述、备注 | 按需填写 | 帮助识别厂商，不影响接口调用方式。 |

点击 **确定** 保存，确认列表中能看到该厂商。厂商页面不填写 API Key，也不会在保存时发起模型调用。

同一租户内，未删除的厂商不能使用相同编码。新增或编辑时，如果提示“当前租户下已存在相同的厂商编码，请勿重复配置”，请回到列表使用已有厂商；只修改名称、地址等信息并保留原编码，可以正常保存。停用厂商仍会占用编码。

需要暂时停止使用某个厂商时，点击 **编辑**，将“状态”改为 **停用** 后保存。该厂商会从模型配置的供应商选项中移除，其模型也不再出现在用户端的可选列表中。已有模型配置仍保留，但后续调用会被后端拒绝；重新启用后即可恢复使用，无需重新创建模型。

停用影响后续请求，不会强行中断已经发往厂商的请求。厂商列表可以按状态筛选，方便找到停用记录并重新启用。

### 2.3 厂商配置如何生效

厂商保存后，模型管理就可以读取它。在创建模型时选择 DeepSeek，模型会保存厂商编码 `deepseek`，并带入厂商的 API 地址。

用户之后选择这个模型聊天时，后端会先读取模型配置，再根据厂商编码找到 `DeepseekServiceImpl`。`ChatServiceFacade` 中的主要代码如下，省略了空值检查：

```java
// 读取用户选择的模型
ChatModelVo chatModelVo =
    chatModelService.selectModelByName(chatRequest.getModel());

// 根据厂商编码选择对应的接入实现
AbstractChatService chatService =
    chatServiceFactory.getOriginalService(chatModelVo.getProviderCode());
```

这就是厂商编码需要与代码一致的原因。名称可以改成方便识别的文字，编码则用于连接模型配置和后端实现。

::: details 厂商、模型与默认地址的关系

`ChatProvider` 将厂商资料保存到 `chat_provider` 表，`ChatModel` 将模型配置保存到 `chat_model` 表。模型记录的是 `providerCode` 字符串，没有保存厂商主键 `providerId`。

普通厂商的地址会在选择厂商时复制到模型表单，并随模型保存。之后修改厂商地址，已有模型仍使用原地址；需要同步更新模型的 `apiHost`。选择 `custom_api` 或 `custom_anthropic` 时，表单会清空地址，要求为该模型手动填写。

厂商列表按 `sortOrder` 升序、`id` 升序排列。模型表单每次打开时都会加载 `status=0` 的厂商，保留同样的排序；已经停用或删除的厂商不可再选。编辑已有模型时，如果其厂商不可用，页面会提示先启用厂商或选择其他厂商。

后端的 `ChatProviderServiceImpl.requireEnabled()` 统一检查厂商是否存在且已启用。模型新增、编辑和按名称加载配置时都会执行这项检查，因此直接调用接口也无法绕过停用限制。用户端模型列表通过 `queryAvailableList()` 只返回启用厂商下的模型，管理端的模型列表和详情仍可查看原配置。

向量和重排工厂在读取客户端缓存前也会重新加载模型、检查厂商状态。停用后的模型不会因为已有缓存而继续被工厂返回；缓存还按模型记录和厂商区分，避免同名模型或切换厂商时复用旧客户端。

模型表单按编码查找厂商，因此 `ChatProviderServiceImpl.validEntityBeforeSave()` 会在新增和编辑前检查编码是否重复。查询由租户插件限定当前租户，并自动排除已逻辑删除的记录；编辑时还会排除当前记录本身。初始化 SQL 中已有 `unique_provider_code(provider_code, tenant_id, del_flag)` 唯一索引，用于在并发保存时兜底。保存前的校验负责提前给出明确提示。

:::

### 2.4 扩展新的厂商：以 PPIO 为例 {#provider-extension}

如果你使用已有厂商，可以继续[添加模型](#configure-model)。需要接入新服务时，先确认它使用什么协议：兼容 OpenAI Chat Completions 的服务，可以参考 `CustomApiServiceImpl` 或下面的 PPIO 实现；使用专用协议的服务，则需要编写对应的客户端适配。

这里以 **PPIO 派欧云** 为例。它提供 OpenAI 兼容的聊天接口，支持完整响应和流式响应，接口路径为 `/openai/v1/chat/completions`。具体协议可以查阅 [PPIO 官方文档](https://ppio.com/docs/model/llm)。

PPIO 已在项目中完成接入，下面说明这次接入涉及哪些代码。你可以用它作为扩展其他厂商的参考；如果只是使用 PPIO，无需重复添加这些代码，直接按本节末尾的说明配置厂商即可。

::: details 查看已有的聊天适配类

以下实现位于后端的 `org.ruoyi.service.chat.impl.provider` 包中：

| 厂商 | 编码 | 适配类 |
| --- | --- | --- |
| DeepSeek | `deepseek` | `DeepseekServiceImpl` |
| PPIO 派欧云 | `ppio` | `PpioChatServiceImpl` |
| OpenAI | `openai` | `OpenAIServiceImpl` |
| 通义千问 / 百炼 | `qianwen` | `QianWenChatServiceImpl` |
| 智谱 | `zhipu` | `ZhiPuChatServiceImpl` |
| Ollama | `ollama` | `OllamaServiceImpl` |
| MiniMax | `minimax` | `MinimaxServiceImpl` |
| 小米 MiMo | `xiaomi` | `MiMoServiceImpl` |
| Atlas Cloud | `atlas` | `AtlaServiceImpl` |
| 自定义 OpenAI | `custom_api` | `CustomApiServiceImpl` |
| 自定义 Anthropic | `custom_anthropic` | `CustomAnthropicServiceImpl` |
| Dify | `dify` | `DifyChatServiceImpl` |
| Coze | `coze` | `CozeChatServiceImpl` |

已有适配类说明项目中有相应的协议代码，实际调用还需要地址和凭据策略支持。当前凭据策略已支持 DeepSeek、PPIO 和两种自定义协议；其他厂商需要配套扩展下文的凭据校验。自定义服务的配置方式见[选择自定义厂商协议](#custom-provider)。

这里的凭据策略指**需要读取 API Key 的调用**。Ollama 的聊天和向量适配器不读取 Key；无需鉴权的 Ollama 可以使用后端可访问的 HTTPS 地址，新建模型时不要填写密钥（通过 API 创建时省略 `apiKey` 或传 `null`，不要传空字符串）。当前保存规则仍会拒绝 HTTP。若 Ollama 网关需要认证，仅配置 HTTPS 不够，还需扩展适配器的认证支持。已有 HTTP 配置的运行截图不代表当前可以新增同样的记录。

Dify、Coze 使用各自的平台适配代码；FastGPT、RAGFlow 当前没有专用适配类，可在目标接口兼容时评估 `custom_api`。具体配置见[模型与平台接入](./models-platforms-integration.md)。

:::

**第一步：实现聊天适配类。** PPIO 与 DeepSeek 都可以使用 OpenAI 兼容客户端。我们为 PPIO 使用独立编码 `ppio`，这样模型会连接 PPIO 的服务，并使用 PPIO 的 Key。

聊天适配类实现 `AbstractChatService`，主要提供三个方法：

| 方法 | 作用 |
| --- | --- |
| `getProviderName()` | 返回厂商编码，PPIO 返回 `ppio`。 |
| `buildStreamingChatModel(...)` | 创建流式客户端，让回答逐段返回。 |
| `buildChatModel(...)` | 创建等待完整结果的客户端，供 Agent、Supervisor 等场景使用。 |

::: details 对照代码：PpioChatServiceImpl

在后端 `ChatModeType` 中定义编码：

```java
PPIO("ppio", "PPIO 派欧云"),
```

适配类位于 `org.ruoyi.service.chat.impl.provider.PpioChatServiceImpl`。以下为实际实现，省略 import：

```java
@Service
public class PpioChatServiceImpl implements AbstractChatService {

    @Override
    public StreamingChatModel buildStreamingChatModel(ChatModelVo config, ChatRequest request) {
        String baseUrl = validateConfiguration(config);
        return OpenAiStreamingChatModel.builder()
            .baseUrl(baseUrl)
            .apiKey(config.resolveApiKeyForConfiguredEndpoint(getProviderName()))
            .modelName(config.getModelName())
            .listeners(List.of(new MyChatModelListener()))
            .returnThinking(Boolean.TRUE.equals(request.getEnableThinking()))
            .timeout(Duration.ofMinutes(3))
            .build();
    }

    @Override
    public ChatModel buildChatModel(ChatModelVo config) {
        String baseUrl = validateConfiguration(config);
        return OpenAiChatModel.builder()
            .baseUrl(baseUrl)
            .apiKey(config.resolveApiKeyForConfiguredEndpoint(getProviderName()))
            .modelName(config.getModelName())
            .listeners(List.of(new MyChatModelListener()))
            .timeout(Duration.ofMinutes(3))
            .build();
    }

    private String validateConfiguration(ChatModelVo config) {
        return ChatModelCredentialPolicy.requirePpioConfiguration(
            config.getProviderCode(), config.getModelName(), config.getApiHost(), config.getApiKey());
    }

    @Override
    public String getProviderName() {
        return ChatModeType.PPIO.getCode();
    }
}
```

`@Service` 让 Spring 发现这个实现。启动时，`ChatServiceFactory` 收集 `AbstractChatService` 类型的 Bean，并按 `getProviderName()` 返回的编码注册，所以无需再给工厂增加分支。每个实现应使用唯一编码，避免当前工厂的 `Map.put()` 覆盖已有映射。

两个客户端在读取 Key 前都执行相同校验，并使用校验后返回的标准地址 `https://api.ppio.com/openai/v1`。LangChain4j 在其后拼接 `/chat/completions`，得到 PPIO 的实际聊天接口。配置中也兼容官方示例里的 `/openai` 写法及末尾斜杠，由适配类统一转换。

PPIO 可以提供不同系列的模型，因此这里没有直接复制 DeepSeek 适配类中的 `thinking`、`reasoning_effort` 和 `parallel_tool_calls` 参数。`returnThinking` 用于接收模型返回的思考内容，并不负责开启远端模型的推理模式。工具调用、图片输入和推理开关，需要按所选 PPIO 模型的能力和参数进一步配置。

:::

**第二步：接入凭据校验。** 能创建客户端后，还要让模型配置可以保存，并在调用时读到正确的 Key。PPIO 使用独立引用 `env:PPIO_API_KEY`，实际 Key 放在后端进程的 `PPIO_API_KEY` 环境变量中。

::: details 对照代码：保存、调用与批量更新共用哪些规则

本次接入同时修改了以下入口：

| 代码位置 | PPIO 的处理方式 |
| --- | --- |
| `ChatModelSecretReference.ENV_REFERENCE_REGEXP` | PPIO 使用 `env:PPIO_API_KEY`。DeepSeek 和两种自定义协议也各有自己的引用规则，继续拒绝明文 Key 和不符合规则的环境变量引用。 |
| `ChatModelCredentialPolicy.requirePersistableConfiguration()` | 模型新增和编辑时，按 `ppio` 编码进入 PPIO 配置校验。 |
| `ChatModelCredentialPolicy.requirePpioConfiguration()` | 检查编码、模型 ID、官方 HTTPS 地址和 PPIO 密钥引用，并返回标准 base URL。 |
| `ChatModelCredentialPolicy.resolveApiKeyForUse()` | 先确认调用方与配置的厂商一致，再通过 `requireTrustedConfiguration()` 选择厂商规则，通过后才读取环境变量。 |
| `ChatModelServiceImpl.updateApiKeyByProvider()` | 支持按 `ppio` 批量更新引用，锁定并校验该厂商的模型后，只更新校验过的模型 ID。 |

厂商与凭据的绑定由 `requireProviderReference()` 统一检查：

```text
ppio     → env:PPIO_API_KEY     → PPIO 官方接口
deepseek → env:DEEPSEEK_API_KEY → DeepSeek 官方接口
```

因此，即使 PPIO 中选择的是 DeepSeek 系列模型，也要使用 `ppio` 厂商和 PPIO 的 Key。把两个厂商的密钥引用混用，保存或调用时都会被拒绝。

PPIO 的模型 ID 按控制台中的完整名称填写，例如官方文档中的 `deepseek/deepseek-r1`。本地校验检查非空、长度和字符格式，不把模型目录写死；该模型是否仍可用、当前账号是否有权限，需要以 PPIO 控制台和实际调用为准。

扩展下一个厂商时，可以沿着这些入口增加它自己的规则。`ChatModelBo` 和 `ModelBatchKeyBo` 共用凭据引用格式校验，真实 Key 始终由后端运行环境提供。

:::

**第三步：在管理端配置厂商。** 管理端的 `apps/web-antd/src/views/chat/provider/options.ts` 已有以下选项，本次沿用即可：

```ts
{ label: 'PPIO', value: 'ppio' },
```

构建并重新启动更新后的后端，然后进入 **厂商管理 → 新增**；如果已有 PPIO 记录，直接编辑它：

| 字段 | 填写内容 |
| --- | --- |
| 厂商名称 | `PPIO` |
| 厂商编码 | 选择 `PPIO`，对应 `ppio` |
| API 地址 | `https://api.ppio.com/openai/v1` |
| 状态 | 启用 |
| 排序、图标、描述 | 按需填写 |

保存后，继续到[模型管理](#configure-model)选择这个厂商。厂商弹窗中的静态选项只提供可选编码，仍然需要保存一条启用的厂商记录，模型表单才能加载它。

这里有三个配置来源：后端 `ChatModeType` 提供编码常量；厂商弹窗从 `options.ts` 读取可选编码；模型弹窗从厂商列表接口读取已保存的厂商。扩展时让它们使用同一个编码即可。后端枚举接口 `/system/model/providerOptions` 不会自动更新当前厂商弹窗的静态选项。

### 2.5 选择自定义厂商协议 {#custom-provider}

服务商提供兼容接口时，可以使用自定义厂商，分别接入 **OpenAI Chat Completions** 和 **Anthropic Messages** 两种协议。

先查看服务商的接口说明或 curl 示例，确认采用哪种协议，再到 **厂商管理 → 新增** 选择对应编码：

| 厂商编码选项 | 保存的编码 | 常见接口路径 | 鉴权方式 |
| --- | --- | --- | --- |
| 自定义 OpenAI | `custom_api` | `/v1/chat/completions` | `Authorization: Bearer ...` |
| 自定义 Anthropic | `custom_anthropic` | `/v1/messages` | `x-api-key`，并携带 `anthropic-version` |

例如，接口调用 `/v1/messages`，并使用 `x-api-key`，就选择“自定义 Anthropic”。协议格式可以对照 [OpenAI Chat Completions 文档](https://platform.openai.com/docs/api-reference/chat/create)和 [Anthropic Messages 文档](https://platform.claude.com/docs/en/api/messages/create)。

厂商名称可以填写为“我的 OpenAI 兼容服务”或“我的 Anthropic 兼容服务”，状态设为 **启用**。两种编码可以各维护一条厂商记录，同一编码下再添加多个模型。原有 `custom_api` 继续使用 OpenAI 协议，升级后无需修改它的编码。

保存厂商后，到 **模型管理 → 新增** 选择它。两种自定义厂商都会显示“请求地址”，你可以为每个模型手动填写服务商的 API Host。表单也会显示当前协议，便于确认是否选对。

| 模型字段 | OpenAI 兼容服务示例 | Anthropic 兼容服务示例 |
| --- | --- | --- |
| 供应商 | 选择刚保存的自定义 OpenAI 厂商 | 选择刚保存的自定义 Anthropic 厂商 |
| 模型分类 | 对话（`chat`） | 对话（`chat`） |
| 模型名称 | 服务商提供的模型 ID | 服务商提供的模型 ID |
| 请求地址 | `https://openai-gateway.example/v1` | `https://anthropic-gateway.example/v1` |
| 密钥 | `env:CUSTOM_OPENAI_API_KEY` | `env:CUSTOM_ANTHROPIC_API_KEY` |

示例域名需要替换为实际服务地址。地址使用 HTTPS，并保留服务商要求的路径前缀，例如 `/api/v1` 或 `/anthropic/v1`。模型保存前，先在后端运行环境中配置与之对应的地址和真实 Key：

```dotenv
CUSTOM_OPENAI_BASE_URL=https://openai-gateway.example/v1
CUSTOM_OPENAI_API_KEY=替换为该服务的真实Key

CUSTOM_ANTHROPIC_BASE_URL=https://anthropic-gateway.example/v1
CUSTOM_ANTHROPIC_API_KEY=替换为该服务的真实Key
```

将这些变量设置到启动后端的终端、IDE 运行配置或容器环境中，然后重启后端。模型表单填写 `env:...` 引用，后端负责读取实际 Key；保存和调用时都会核对请求地址是否与这份 Key 绑定的地址一致。

如果同一种协议要接入多个地址，可以为每个服务增加一组带名称的变量。例如，模型使用 `env:CUSTOM_OPENAI_TEAM_A_API_KEY` 时，后端配置 `CUSTOM_OPENAI_TEAM_A_API_KEY` 和 `CUSTOM_OPENAI_TEAM_A_BASE_URL`；Anthropic 同理使用 `CUSTOM_ANTHROPIC_TEAM_A_...`。名称使用大写英文字母开头，后续可用大写字母、数字和下划线，最多 32 个字符。

完成后，继续[填写并保存模型](#configure-model)，再到[用户端选择模型](#use-model)发起对话。用户端的操作与 DeepSeek、PPIO 相同。

::: details curl 检查示例与地址处理

下面是服务商接口的直连示例，适用于 Bash。将域名和 `YOUR_MODEL_ID` 替换成实际值，并在执行 curl 的终端设置相应环境变量。

OpenAI Chat Completions：

```bash
curl https://openai-gateway.example/v1/chat/completions \
  -H "Authorization: Bearer $CUSTOM_OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"YOUR_MODEL_ID","stream":true,"messages":[{"role":"user","content":"你好"}]}'
```

Anthropic Messages：

```bash
curl https://anthropic-gateway.example/v1/messages \
  -H "x-api-key: $CUSTOM_ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"YOUR_MODEL_ID","max_tokens":4096,"stream":true,"messages":[{"role":"user","content":"你好"}]}'
```

模型表单建议填写去掉 `/chat/completions` 或 `/messages` 后的 base URL。当前实现也接受所选协议的完整接口地址，会先去掉对应末尾路径，再交给客户端拼接；末尾斜杠会统一处理。只填写域名时，默认使用 `/v1`。如果服务商有其他路径前缀，应按其文档完整填写。

两种适配都支持流式和完整响应。Anthropic 默认最大输出为 4096 tokens；这里只解析模型返回的思考内容，没有为任意兼容服务统一开启推理模式。需要额外请求头、专用参数、非标准鉴权或其他媒体接口时，应按服务商协议扩展对应适配类。

:::

::: details 两种自定义协议对应哪些代码

- `ChatModeType` 和管理端 `provider/options.ts` 定义两个独立的厂商编码。
- `CustomApiServiceImpl` 使用 `OpenAiChatModel` / `OpenAiStreamingChatModel`，`CustomAnthropicServiceImpl` 使用 `AnthropicChatModel` / `AnthropicStreamingChatModel`。`ChatServiceFactory` 按编码自动选择实现。
- `model-modal.vue` 通过 `getCustomProviderConfig()` 识别两种自定义厂商，显示协议、请求地址和密钥引用提示。新选择厂商时清空地址，编辑已有模型时保留地址；编辑时密钥留空会保留原引用。
- `CustomApiCredentialPolicy` 统一校验协议、地址和专用密钥引用。模型新增、编辑、批量密钥更新和调用都复用这套规则。批量更新时，所有目标模型都必须匹配该引用绑定的地址，否则整批拒绝。

本功能复用模型已有的 `providerCode`、`apiHost` 和 `apiKey` 字段，无需新增数据库字段。更新后端和管理端后，在厂商管理中创建相应记录即可。

:::

## 3. 在模型管理中配置模型 {#configure-model}

### 3.1 在字典中维护模型分类 {#model-category-dict}

添加模型前，先确认需要的分类已经准备好。模型表单里的“模型分类”由字典维护，其中 **对话** 对应的数据键值是 `chat`。如果下拉框中已经有需要的选项，可以直接继续配置模型。

需要查看或调整分类时，进入管理端的 **系统管理 → 字典管理**，按下面的顺序操作：

1. 在字典类型列表中找到 **模型分类**，字典类型为 `chat_model_category`。如果没有这条记录，先新增字典类型，名称填写“模型分类”，类型填写 `chat_model_category`。
2. 点击这条字典类型，在对应的字典数据列表中查看已有分类。普通聊天需要一条数据标签为“对话”、数据键值为 `chat` 的记录；已有时直接使用，需要调整显示名称时点击 **修改**。
3. 缺少所需分类时，点击字典数据列表中的 **新增**，填写标签、键值和排序后保存。
4. 返回 **对话管理 → 模型管理**，新增模型时选择相应分类。如果选项仍未更新，在字典管理中点击 **刷新缓存**，再刷新管理端页面、重新打开模型表单。

以“对话”这条字典数据为例：

| 字段 | 填写内容 | 作用 |
| --- | --- | --- |
| 字典类型 | `chat_model_category` | 归属“模型分类”字典，选择字典后自动带入。 |
| 数据标签 | `对话` | 模型表单和列表中显示的分类名称，可以按需要调整。 |
| 数据键值 | `chat` | 保存到模型的 `category` 字段，后端据此查询和使用模型。 |
| 显示排序 | `0` | 字典选项按数值从小到大排列。 |
| 标签样式、备注 | 按需填写 | 用于展示和说明。 |

普通聊天使用的键值应保持为 `chat`。例如，可以把数据标签改为“聊天模型”，保存到模型中的分类仍是 `chat`；修改字典键值不会同步修改已有模型的分类。

::: details 字典选项如何进入模型表单

管理端在 `packages/@core/base/shared/src/constants/dict-enum.ts` 中定义字典类型：

```ts
CHAT_MODEL_CATEGORY: 'chat_model_category',
```

`model-modal.vue` 通过下面这行代码读取分类选项，再做页面补充和厂商筛选：

```ts
const options = [...getDictOptions(DictEnum.CHAT_MODEL_CATEGORY)];
```

`getDictOptions()` 首次读取时请求 `GET /system/dict/data/type/chat_model_category`，并在管理端缓存结果。字典的 `dictLabel` 转成下拉框的 `label`，`dictValue` 转成 `value`；选择“对话”后，模型表单将 `chat` 保存到 `category`。模型列表也通过同一字典显示分类名称。

当前表单还会在字典缺项时补充 `image`、`audio`、`video` 和 `rerank`，并根据厂商筛选重排序选项。因此，维护分类时以字典为入口，同时需要留意表单中的这些兼容逻辑。

新增字典数据可以提供新的分类选项。要让新分类用于实际功能，还需要相应的模型实现、后端查询和前端使用入口；具体用途见[配置其他用途的模型](#model-categories)。接入 PPIO 的普通聊天可以直接复用已有的“对话 / `chat`”分类。

:::

### 3.2 选择刚配置的厂商

厂商准备好后，进入 **对话管理 → 模型管理**，点击 **新增**。在“供应商”下拉框中选择刚才保存的厂商，例如 DeepSeek 或 PPIO。

![模型管理页面](/images/model/model-list-runtime.png)

“供应商”选项显示的是厂商名称，保存到模型中的则是厂商编码。例如，选择名称为 DeepSeek 的厂商后，模型记录中的 `providerCode` 为 `deepseek`。

如果没有看到刚新增的厂商，先确认厂商状态为 **启用**，再关闭并重新打开模型窗口。每次打开时，页面都会通过 `GET /system/provider/list` 携带 `status=0` 加载最新厂商列表。

### 3.3 填写模型配置

先配置一个用于普通对话的模型。以当前代码允许的 DeepSeek 模型为例：

| 字段 | 示例 | 说明 |
| --- | --- | --- |
| 供应商 | `DeepSeek` | 选择上一步配置的厂商。 |
| 模型分类 | 对话（`chat`） | 来自 `chat_model_category` 字典，普通聊天页面默认加载这一类模型。 |
| 模型名称 | `deepseek-v4-flash` | 发给模型服务的真实模型 ID。 |
| 模型描述 | `DeepSeek V4 Flash` | 便于用户识别的显示名称。 |
| 请求地址 | `https://api.deepseek.com` | 选择普通厂商时自动带入，当前聊天表单默认不显示该输入框。 |
| 密钥 | `env:DEEPSEEK_API_KEY` | 当前代码要求填写环境变量引用。 |
| 备注 | 按需填写 | 可以补充模型用途。 |

`env:DEEPSEEK_API_KEY` 表示：调用时由后端读取名为 `DEEPSEEK_API_KEY` 的环境变量。请在启动后端的终端、IDE 运行配置或容器环境中设置实际 Key，并重新启动后端，让进程读取到这个变量。

这个引用填在管理端的“密钥”字段中；真实 Key 配置在后端运行环境中。用户端选择模型时，不需要再填写 Key。

如果上一步配置的是 **PPIO**，在同一个模型表单中改用以下内容：

| 字段 | PPIO 示例 |
| --- | --- |
| 供应商 | `PPIO` |
| 模型分类 | 对话（`chat`） |
| 模型名称 | 从 PPIO 控制台复制完整模型 ID，例如 `deepseek/deepseek-r1`；以账号当前可用模型为准。 |
| 模型描述 | `PPIO DeepSeek R1`，也可以填写方便识别的名称。 |
| 请求地址 | 自动带入 `https://api.ppio.com/openai/v1`。 |
| 密钥 | `env:PPIO_API_KEY` |

在后端的运行环境中设置 `PPIO_API_KEY` 为 PPIO 控制台生成的真实 Key，然后重新启动后端。保存模型后，按[用户端操作](#use-model)选择这个模型发起对话；浏览器中无需配置 PPIO Key。

::: info 使用其他厂商

DeepSeek、PPIO 和两种自定义协议都已支持地址与凭据校验。兼容服务可以按[自定义厂商配置](#custom-provider)接入；其他厂商即使已有适配类，也需要确认凭据策略已支持。开发步骤见[扩展新的厂商](#provider-extension)。

:::

::: details 自定义地址与已有模型的更新

选择 `custom_api` 或 `custom_anthropic` 时，请手动填写服务的 API base URL。前者使用 OpenAI Chat Completions 协议，后者使用 Anthropic Messages 协议；地址与凭据的准备方式见[自定义厂商配置](#custom-provider)。

选择普通厂商时，管理端 `model-modal.vue` 会执行以下地址联动，省略了表单校验代码：

```ts
if (getCustomProviderConfig(newProviderCode)) {
  formData.value.apiHost = undefined;
} else if (newProviderCode && providersMap.value.has(newProviderCode)) {
  const provider = providersMap.value.get(newProviderCode);
  formData.value.apiHost = provider.apiHost;
}
```

编辑已有模型时，`isLoading` 会跳过这段逻辑，保留原地址。需要更新普通聊天模型的地址时，可通过 `PUT /system/model` 提交新 `apiHost`，同时携带模型 ID、厂商编码、模型名和分类等必填字段。

直接通过接口新增模型时也要传入地址，`ChatModelServiceImpl` 不会查询厂商表自动补齐。当前模型保存要求 HTTPS 地址。

:::

### 3.4 保存模型

点击 **确定** 后，在列表中确认厂商、分类、模型名称和描述都正确。如果厂商在填写期间被停用，后端会拒绝保存并提示先启用厂商。配置成功后，下一步是在用户端发起一次对话。

厂商管理和模型管理的保存操作都不会自动测试远端接口。是否能够正常回答，需要在实际调用时确认。

### 3.5 配置其他用途的模型 {#model-categories}

模型分类决定它用于哪个功能。如果只是接入普通聊天，选择字典中的“对话 / `chat`”即可；需要知识库或媒体功能时，先在[模型分类字典](#model-category-dict)中确认相应选项，再创建模型。下面列出常用分类的数据键值和用途，页面显示名称可以通过字典标签调整。

| 模型分类 | 用途 | 配置后在哪里使用 |
| --- | --- | --- |
| `chat` | 对话与推理 | 用户端普通对话、智能体、流程中的 LLM 节点。 |
| `vector` | 将内容转换为向量 | 知识库的向量模型配置。 |
| `rerank` | 对检索结果重新排序 | 知识库的重排模型配置。 |
| `image` | 图片生成 | 用户端[媒体工作台](./multimodal.md#frontend-use)的“图片生成”。 |
| `audio` | 语音生成 | 媒体工作台的“语音合成”。 |
| `video` | 视频生成与任务查询 | 媒体工作台的“视频生成”。 |

`text`、`ppt`、`music` 目前属于扩展或预留分类。向量模型还需要填写模型维度，并与实际输出一致。具体使用方式见[知识管理](./knowledge.md)和[多模态能力](./multimodal.md)。

::: details 同一个厂商如何提供向量、重排和媒体能力

不同能力使用独立工厂。以百炼为例，可以分别创建聊天、向量和重排模型，并都选择 `qianwen` 厂商：

| 能力 | 模型中的厂商编码 | 后端选择的实现 |
| --- | --- | --- |
| 聊天 | `qianwen` | `QianWenChatServiceImpl` |
| 文本向量 | `qianwen` | `alibailian` Bean |
| 重排 | `qianwen` | `qianwenRerank` Bean |

`EmbeddingModelFactory` 将 `qianwen` 映射为 `alibailian`，其他编码默认按原名查找 `BaseEmbedModelService` Bean。已有向量 Bean 包括 `openai`、`ollama`、`alibailian`、`bailianMultiModel`、`zhipu`、`minimax`、`siliconflow`。

`RerankModelFactory` 优先查找 `厂商编码 + Rerank`，没有找到时再使用原编码。已有重排 Bean 包括 `qianwenRerank`、`zhipuRerank`、`siliconflowRerank`。管理端还在 `model-modal.vue` 中用 `supportedRerankProviders` 控制分类选项，新增重排厂商时要同步两处筛选和切换校验。

当前页面和初始化数据使用 `rerank`，`ModelType.RERANKER` 的值仍是 `reranker`，创建供知识库选择的模型时应使用当前接口查询的 `rerank`。

扩展向量和重排实现时，需要实现对应接口，并通过 `configure(ChatModelVo)` 接收模型配置。如果配置保存在实例字段中，应使用 `@Scope("prototype")`，避免多个模型共用同一份客户端配置。

图片、音频、视频分别实现 `IImageGenerationService`、`IAudioGenerationService`、`IVideoGenerationService`，由各自工厂按 `getProviderName()` 注册。当前媒体工厂对 `custom_api` 有回退到 `openai` 的规则，目标服务仍需支持对应的媒体协议。

:::

## 4. 在用户端选择并使用模型 {#use-model}

### 4.1 启动用户端

保持后端和管理端运行，另开一个终端，在用户端项目 `ruoyi-web` 中执行：

```powershell
Set-Location D:\Project\github\ruoyi-web
pnpm install
pnpm run dev
```

打开终端显示的地址，并进入 `/chat` 页面。默认通常是 [http://localhost:5173/chat](http://localhost:5173/chat)。

如果本地文档站已经占用了 `5173`，以用户端终端实际输出的端口为准。也可以使用 `pnpm run dev --port 5180` 指定端口，然后访问 [http://localhost:5180/chat](http://localhost:5180/chat)。

用户端开发配置中的 `VITE_API_URL` 应指向与管理端相同的后端。当前默认值为 `http://127.0.0.1:6039`。

### 4.2 登录并选择模型

打开用户端后，先点击右上角 **登录**。使用能够访问这些模型的账号，并确认与管理端配置所在的租户一致。

![用户端聊天页面，模型入口位于输入框左下角](/images/runtime/user-home.png)

登录后，按下面的顺序操作：

1. 点击左侧 **新对话**，进入新的聊天页面。
2. 点击输入框左下角的模型按钮，展开模型列表。如果这里显示的是智能体或工作流名称，先展开并选择 **切换到模型**。未登录时，这里显示“登录后选择模型”。
3. 根据显示名称或模型 ID，选择刚才配置的模型。列表优先显示管理端填写的“模型描述”，例如 `DeepSeek V4 Flash`；没有填写描述时，自动显示 `deepseek-v4-flash` 这样的模型 ID。
4. 确认输入框左下角已经显示所选模型，再输入问题。

每次打开模型列表时，页面都会重新请求模型数据，只显示启用厂商下的模型。管理员刚新增模型或重新启用厂商后，重新展开列表即可加载；还未出现时，可以刷新用户端。即使页面还保留着停用前选中的模型，发送新消息时，后端仍会检查厂商状态。

### 4.3 发送第一条消息

输入一条简单的问题，例如：

```text
你好，请用一句话介绍你能做什么。
```

点击发送按钮。页面会创建会话，并通过所选模型发送请求。正常情况下，回答逐段出现；回答结束后，可以继续追问，也可以从左侧重新打开这次会话。

首次验证时，先使用普通模型完成一次对话。之后再按需要配置[智能体](./agent.md)或[流程编排](./orchestration.md)，让模型参与更复杂的任务。

::: details 前端选择的模型如何传给后端

`ModelSelect` 从 `GET /system/model/modelList` 获取列表。当前普通聊天不传分类参数，后端默认返回 `chat` 分类，因此向量和重排模型不会出现在这个列表中。

选择模型后，`useModelStore` 保存当前选项。聊天页发送请求时，将其中的 `modelName` 放入 `model` 字段。普通对话请求可以理解为下面这样，实际请求还包含会话 ID 等字段：

```json
{
  "model": "deepseek-v4-flash",
  "content": "你好，请用一句话介绍你能做什么。"
}
```

请求发往 `POST /chat/send`。后端按模型名读取配置，找到厂商实现，再读取服务地址和凭据进行调用。前端负责选择模型，服务地址和 Key 留在后端处理。

由于聊天按 `modelName` 查询配置，同一租户内应避免创建同名模型。当前查询使用 `LIMIT 1`，重复名称会让选中的配置不明确。

智能体或工作流模式会使用各自绑定的模型。此时输入框显示的是应用选择入口，需要展开并选择 **切换到模型**，再按本节选择模型。单击“新对话”只会打开新会话页面，不会清除已选择的应用模式。

:::

### 4.4 确认模型已经可用

完成一次对话后，检查这三个结果：

- 用户端能找到并选择刚配置的模型。
- 发送消息后，能收到正常结束的回答。
- 刷新页面或重新打开会话，消息仍然存在。

如果接入的是向量模型，应到知识库上传样例并验证检索结果；接入重排模型时，应结合后端调用日志，检查排序和分数变化。重排失败时会回退到粗召回结果，因此仍能检索到内容并不代表重排调用成功。它们各自通过对应功能验证，普通聊天只验证聊天能力。

## 5. 遇到问题时如何排查 {#troubleshooting}

按刚才的操作顺序检查，通常更容易定位问题：

| 遇到的情况 | 先检查什么 |
| --- | --- |
| 管理端无法登录或接口连接失败 | 后端是否启动，管理端代理是否指向正确地址。 |
| 新增厂商时找不到编码 | 管理端 `options.ts` 是否已增加选项；新增后端枚举不会自动更新这里。 |
| 保存厂商时提示编码重复 | 同一租户内是否已有该编码的厂商，停用记录也要检查。已有厂商可直接复用，无需再次新增。 |
| 模型表单中找不到刚新增的厂商 | 确认厂商已启用，再关闭并重新打开模型窗口；检查两端的租户和账号权限。 |
| 模型分类中没有“对话”，或修改后选项未更新 | 在 **系统管理 → 字典管理** 中检查 `chat_model_category` 是否包含键值 `chat`；保存后刷新字典缓存和管理端页面，再打开模型表单。 |
| 保存或调用模型时提示厂商未配置或已停用 | 到厂商管理中检查相同编码的记录，重新启用厂商，或改用其他已启用厂商的模型。 |
| 保存模型时提示地址或密钥格式错误 | 当前代码要求 HTTPS 地址和与厂商匹配的环境变量引用；DeepSeek 使用 `env:DEEPSEEK_API_KEY`，PPIO 使用 `env:PPIO_API_KEY`。PPIO 地址填写 `https://api.ppio.com/openai/v1`。 |
| 用户端列表中没有新模型 | 是否已登录、厂商是否启用、模型分类是否为 `chat`，两端是否连接同一后端并处于同一租户。 |
| 模型列表接口返回权限错误 | 当前接口需要 `system:model:list` 或 `coding:harness:use` 权限，由管理员确认账号授权。 |
| 修改了厂商地址，调用仍使用旧地址 | 已有模型保存了独立的 `apiHost`，需要更新模型地址。 |
| 提示“不支持的模型类别” | 模型中的厂商编码是否与适配类的 `getProviderName()` 一致，更新后的后端是否已启动。 |
| 调用时报环境变量未配置、401 或 403 | 后端进程是否读取到正确的 Key，以及厂商账号的鉴权、权限和额度。 |
| 调用出现 404 或模型不存在 | 实际 API 地址和模型 ID 是否正确。 |
| 自定义厂商提示地址环境变量未配置或地址不一致 | 检查当前协议的 `CUSTOM_OPENAI_...` 或 `CUSTOM_ANTHROPIC_...` 密钥引用，以及后端对应的 `_BASE_URL` 环境变量；模型请求地址必须与其一致。 |
| 普通对话成功，智能体调用失败 | 厂商的阻塞客户端是否实现，以及模型是否支持所需的工具调用。 |

### 模型列表的显示名称 {#model-display}

用户端的模型列表和当前模型按钮都优先显示 `modelDescribe`。描述未填写、为空字符串或只有空格时，自动使用 `modelName`；尚未选择模型时，按钮显示“选择模型”。悬停在列表项上可以查看完整模型 ID。

后端 `ChatModelSelectVo` 返回 `id`、`modelName`、`modelDescribe` 和 `providerCode`，供前端识别和展示模型。请求地址、密钥和内部备注不会通过这个接口返回。选中状态按模型记录 ID 判断，同样的显示名称不会导致多个选项同时高亮。

修改管理端的“模型描述”可以调整显示名称，实际调用仍使用 `modelName`。旧版本升级后，请重新构建并启动后端和用户端，再刷新页面加载最新接口和页面资源。

::: details 相关代码位置

后端主要代码位于 `ruoyi-ai/ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/`：

```text
controller/chat/ChatProviderController.java
controller/chat/ChatModelController.java
domain/entity/chat/ChatProvider.java
enums/ChatModeType.java
factory/ChatServiceFactory.java
factory/EmbeddingModelFactory.java
factory/RerankModelFactory.java
service/chat/AbstractChatService.java
service/chat/impl/ChatServiceFacade.java
service/chat/impl/ChatModelServiceImpl.java
service/chat/impl/ChatProviderServiceImpl.java
service/chat/impl/provider/
```

模型配置、精简返回对象和凭据校验位于 `ruoyi-ai/ruoyi-common/ruoyi-common-chat/src/main/java/org/ruoyi/common/chat/`：

```text
entity/chat/ChatModel.java
domain/vo/chat/ChatModelVo.java
domain/vo/chat/ChatModelSelectVo.java
domain/bo/chat/ChatModelBo.java
domain/bo/chat/ModelBatchKeyBo.java
security/ChatModelCredentialPolicy.java
security/ChatModelSecretReference.java
security/CustomApiCredentialPolicy.java
```

管理端代码位于 `ruoyi-admin/apps/web-antd/src/`：

```text
views/chat/provider/options.ts
views/chat/provider/provider-modal.vue
views/chat/model/model-modal.vue
views/system/dict/index.vue
utils/dict.ts
store/dict.ts
api/chat/provider/index.ts
```

用户端代码位于 `ruoyi-web/src/`：

```text
components/ModelSelect/index.vue
components/ChatSender/index.vue
stores/modules/model.ts
api/model/index.ts
pages/chat/layouts/chatWithId/index.vue
```

:::
