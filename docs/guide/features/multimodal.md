---
outline: deep
pageClass: multimodal-guide
---

# 多模态与媒体能力

RuoYi AI 提供图片生成、语音合成和视频生成的接口，并在用户端提供 **媒体工作台**，用于选择模型、填写生成参数和查看结果。本页先介绍能力范围与相关概念，再说明模型配置、工作台使用和接口联调的方法。

## 能力概览 {#capabilities}

| 能力 | 输入与结果 | 使用入口 |
| --- | --- | --- |
| **图片生成（文生图）** | 输入文字描述，生成图片；可按模型能力设置尺寸、随机种子等参数。 | 媒体工作台的 **图片生成**，或 `POST /media/image`。 |
| **语音合成（文本转语音）** | 输入朗读文本，生成音频；可按模型能力选择音色、格式和语速。 | 媒体工作台的 **语音合成**，或 `POST /media/speech`。 |
| **视频生成（文生视频）** | 输入场景与镜头描述，创建视频任务，再查询生成结果。 | 媒体工作台的 **视频生成**，或 `POST /media/video`。 |
| **任务查询与结果预览** | 查询异步任务的进度，预览图片、播放音视频，并保存结果或任务 ID。 | 工作台的结果区、**本次任务**和**查询已有任务**。 |

上述页面和接口已有实现，**实际生成前仍需补齐后端媒体凭据接入，并配置可用的厂商与模型**，详见[调用前的接入条件](#credential-readiness)。可选参数和任务查询方式也取决于所用服务，配置媒体模型时需要一起确认。

普通聊天中的图片附件目前只支持本地预览，尚未接通看图问答或 OCR；媒体工作台也暂不提供参考图上传和图片编辑。相关说明见[聊天附件与扩展](#chat-attachments)。

## 理解多模态与媒体生成 {#concepts}

**多模态**是指处理文本、图片、音频、视频等多种形式的信息。常见用法既包括“输入图片，让模型理解内容”，也包括“输入文字，让模型生成图片或音视频”。本页主要介绍后一类，即**媒体生成**。

配置和使用时，还会遇到以下概念：

| 概念 | 在本功能中的含义 |
| --- | --- |
| **厂商与模型** | 厂商决定后端调用哪家服务、使用哪种接口；模型名称指定该服务上的具体模型。 |
| **模型分类** | `image`、`audio`、`video` 分别用于图片、语音和视频生成，决定模型出现在哪个入口。分类需与模型的实际能力一致。 |
| **同步结果** | 一次请求直接返回图片或音视频资源，工作台收到后即可展示。 |
| **异步任务** | 请求先返回任务 ID，生成过程在服务端继续进行；工作台通过查询任务状态获取最终结果。 |

首次使用可按 **准备厂商与凭据 → 配置媒体模型 → 在工作台生成 → 查看或查询结果** 的顺序操作。下面第 1～3 节介绍配置，第 4 节介绍工作台；已有配置时可直接阅读[工作台使用](#frontend-use)，需要调试接口时再看[接口联调](#verify-api)。

## 1. 启动管理端，找到媒体模型 {#start-admin}

先按[本地安装与启动](../getting-started/install.md)启动后端，再启动管理端：

```powershell
Set-Location D:\Project\github\ruoyi-admin
pnpm install
pnpm run dev:antd
```

将项目路径替换成你的目录，已安装依赖时可以跳过 `pnpm install`。打开终端显示的地址，默认是 [http://localhost:5666](http://localhost:5666)，登录后进入 **对话管理 → 模型管理**。管理端开发代理默认连接 `http://127.0.0.1:6039`，后面的接口示例也使用这个后端地址。

先搜索要使用的模型，确认是否已有配置。下面以本地已有的 Atlas Cloud 图片模型为例，说明列表中的字段；实际使用时搜索你接入的模型名称：

![运行中的模型管理列表，按 gpt-image 筛选出 Atlas Cloud 的图片模型](/images/multimodal/image-model-list.png)

这里的模型名称以 `openai/` 开头，但厂商编码是 `atlas`，所以后端会调用 Atlas Cloud 的适配器。**决定调用哪家服务的是供应商，模型名称则指定这家服务上的具体模型。** 列表中存在图片编辑模型，也不代表公共生成接口已经支持传入参考图。

## 2. 确认厂商和凭据接入条件 {#configure-provider}

### 2.1 在厂商管理中检查服务

进入 **对话管理 → 厂商管理**，检查目标厂商的编码和状态。模型表单只加载已启用的厂商；厂商停用后，已有模型的新调用也会被拒绝。厂商的配置与扩展方式可参考[模型管理](./model.md#configure-provider)。

根据需要的媒体能力确认厂商实现。下表列出**代码中已有的适配关系**，选择后还需按下一节检查凭据接入条件。

| 厂商编码 | 已有的媒体实现 | 选择时注意 |
| --- | --- | --- |
| `openai` | 图片、文本转语音、视频创建与查询 | 服务需要提供对应的媒体接口，仅兼容聊天接口还不够。 |
| `atlas` | 图片、音频、视频及异步任务查询 | 模型名称使用 Atlas 平台中的完整 ID。 |
| `Tongyiwanx` | 通义万相文生图 | 编码区分大小写，通过万相 SDK 调用。 |
| `custom_api` | 工厂会回退到 OpenAI 媒体实现 | 当前回退与凭据校验不匹配，不能直接复用自定义聊天配置。 |

`custom_anthropic` 当前没有媒体生成适配器。DeepSeek、PPIO、Ollama 等聊天厂商可用，也不等于拥有图片、语音或视频生成实现。

如果模型表单中没有 Atlas Cloud，先检查当前租户下是否已有 `atlas` 厂商记录，以及它是否启用。当前管理端新增厂商的静态选项还不包含 `atlas`、`Tongyiwanx`；新环境需要先补充 `ruoyi-admin/apps/web-antd/src/views/chat/provider/options.ts` 中的选项，再创建记录。截图使用的是已有的 Atlas Cloud 厂商。

### 2.2 调用前的接入条件 {#credential-readiness}

向服务商准备好 API 地址、真实模型 ID 和有相应媒体权限的密钥后，还需要确认后端能按该厂商读取密钥。

::: warning 当前代码还需要补齐媒体凭据接入

模型保存要求使用受信任的环境变量引用，不能在“密钥”中直接填写真实 Key。现有凭据策略已处理 DeepSeek、PPIO 和两种自定义聊天协议，但尚未为 `openai`、`atlas`、`Tongyiwanx` 建立对应的凭据规则。

另外，`custom_api` 的媒体请求会进入 `openai` 适配器；适配器以 `openai` 身份读取密钥，与模型保存的 `custom_api` 编码不一致，会被校验拒绝。因此，仅选择“自定义 OpenAI”并填写 API Host，还不能完成媒体调用。

:::

如果你正在开发媒体功能，先完成以下接入，再执行后面的生成请求：

1. 在 `ChatModelSecretReference` 中定义该媒体厂商允许使用的环境变量引用。
2. 在 `ChatModelCredentialPolicy` 中补齐保存和调用时的厂商、地址、模型、密钥引用校验，将凭据绑定到实际使用它的服务地址。
3. 使用自定义 OpenAI 媒体服务时，让适配器按配置的协议身份读取凭据，并沿用对应的地址绑定规则。
4. 为有效配置、错误地址、错误厂商和缺失环境变量验证行为，再重新构建并启动后端。

引用的格式是 `env:变量名`。例如已有的自定义聊天配置使用 `env:CUSTOM_OPENAI_API_KEY`，后端读取的是进程环境中的 `CUSTOM_OPENAI_API_KEY`。媒体厂商也需要先在代码中明确允许的变量名，再按同样格式填写。

真实 Key 配置到 **Java 后端进程的环境变量**：本地开发可在 IDE 的运行配置中设置，容器部署则通过容器环境注入。设置后重新启动后端，在模型表单中只填写引用。将变量写入 `ruoyi-web` 的 `.env` 不会提供给后端，也不应把厂商 Key 放入前端构建配置。

这部分是继续接入需要完成的代码工作。初始化 SQL 中的占位密钥、已有模型记录以及表单中的空密钥框，都不能证明已经具备调用条件。

## 3. 在字典和模型管理中完成配置 {#configure-model}

### 3.1 确认模型分类

模型分类由字典维护。进入 **系统管理 → 字典管理**，找到类型为 `chat_model_category` 的“模型分类”，点击字典类型查看数据：

| 页面标签 | 数据键值 | 对应接口 |
| --- | --- | --- |
| 图像，也可以显示为“图片” | `image` | `POST /media/image` |
| 语音，也可以显示为“音频” | `audio` | `POST /media/speech` |
| 视频 | `video` | `POST /media/video`、`GET /media/video` |

缺少选项时新增对应字典数据，保存后刷新字典缓存，再重新打开模型表单。当前表单也会在字典缺项时补充这三个媒体分类，但维护显示名称和排序仍应从字典入手，详细操作见[模型分类字典](./model.md#model-category-dict)。

![真实模型表单中的分类下拉框，显示图像 image、语音 audio 和视频 video](/images/multimodal/media-categories.png)

可以调整标签，数据键值应保持不变。后端按 `image`、`audio`、`video` 检查用途；将聊天模型改成“图像”分类，不会让它自动具备生成图片的能力。

### 3.2 配置一个图片模型

回到 **对话管理 → 模型管理**。已有记录点击 **编辑** 检查，没有记录时点击 **新增**，选择上一节确认的厂商。下面用本地已有的 Atlas Cloud 文生图配置说明字段：

![真实 Atlas Cloud 文生图模型编辑页，包含供应商、分类、模型名称和请求地址](/images/multimodal/image-model-form.png)

| 字段 | 截图中的配置 | 如何填写 |
| --- | --- | --- |
| 供应商 | Atlas Cloud | 对应已启用的 `atlas` 厂商。 |
| 模型分类 | 图像 | 保存的数据键值是 `image`。 |
| 模型名称 | `openai/gpt-image-2/text-to-image` | 使用你实际接入服务的模型 ID，接口请求中的 `model` 也填这个值。 |
| 模型描述 | GPT-IMAGE-2 文生图 | 用于页面展示，不代替接口中的模型名称。 |
| 请求地址 | `https://api.atlascloud.ai/v1` | 填服务的基础地址；后端根据适配器拼接调用路径。 |
| 密钥 | 编辑页不回显 | 完成媒体凭据接入后，填写该厂商允许的环境变量引用。 |
| 备注 | 模型用途说明 | 便于维护，不会变成生成请求参数。 |

选择普通厂商时，表单会把厂商地址带入模型；之后修改厂商地址，需要同时检查已有模型的请求地址。完成凭据接入后再保存有效配置，返回列表核对供应商、分类和模型名称。

::: details 请求地址如何变成实际接口地址

- OpenAI 媒体实现通过 `OpenAiMediaSupport.endpoint()` 拼接 `/v1/images/generations`、`/v1/audio/speech`、`/v1/videos`。基础地址已有 `/v1` 时不会重复补齐。
- Atlas 实现通过 `AtlasMediaSupport.endpoint()` 使用 `/api/v1` 路径。例如截图中的 `https://api.atlascloud.ai/v1`，查询任务时会转换为 `https://api.atlascloud.ai/api/v1/model/prediction/{id}`。
- 通义万相当前通过 `ImageSynthesis` SDK 调用，构建参数时没有使用模型的 `apiHost`。如需指定其他端点，还需要调整 SDK 接入代码。

:::

### 3.3 配置语音或视频模型

语音模型按同样方式配置，将分类设为 **语音 / `audio`**，模型名称填写服务商的语音合成模型 ID。`voice`、输出格式和语速由生成请求传入，不在模型表单的备注里配置。

视频模型选择 **视频 / `video`**。下面是本地已有的视频配置，使用 `bytedance/seedance-2.0/text-to-video`：

![真实 Atlas Cloud 视频模型编辑页，分类为 video](/images/multimodal/video-model-form.png)

每条模型记录对应一种分类。先选定一种媒体能力完成接口验证，再接其他能力，会更容易定位地址、模型参数或凭据问题。

## 4. 在媒体工作台中生成和查看结果 {#frontend-use}

### 4.1 打开工作台

启动用户端。本地同时运行文档站时，可以给用户端单独指定端口：

```powershell
Set-Location D:\Project\github\ruoyi-web
pnpm install
pnpm run dev --port 5180
```

打开 [http://localhost:5180/media](http://localhost:5180/media)，或登录用户端后点击左侧的 **媒体工作台**。未登录时页面会提示登录，登录后自动加载模型。

顶部有 **图片生成、语音合成、视频生成** 三个入口，分别读取 `image`、`audio`、`video` 分类的模型。刚在管理端保存配置时，点击 **刷新模型** 即可重新加载。没有可用模型时，页面会提示管理员检查对应分类和厂商状态。

工作台负责填写参数、提交任务和展示结果，服务商地址与密钥仍由后端读取。开始生成前，需要完成[媒体凭据接入](#credential-readiness)。

### 4.2 生成一张图片

1. 选择 **图片生成**，在 **生成模型** 中选择文生图模型。模型下方会显示厂商编码和完整模型名称，方便核对配置。
2. 填写 **内容描述**，说明主体、场景和风格；也可以点击 **填入示例描述** 后修改。
3. 有需要时展开 **更多参数**，填写画面尺寸和随机种子。参数留空时使用模型默认值。
4. 点击 **生成图片**，在右侧查看提交状态和结果。

![实际运行的媒体工作台，选择已有 Atlas 图片模型并填写描述，尚未提交生成](/images/multimodal/workbench-image.png)

模型选项优先显示模型描述，描述为空时显示模型名称。工作台当前处理文本生成图片，不包含参考图上传和图片编辑；即使列表中存在编辑模型，也应在这里选择文生图模型。

### 4.3 合成语音或生成视频

切换到 **语音合成**，选择语音模型，填写 **朗读文本**。需要调整时，在 **更多参数** 中填写音色、音频格式、语速和朗读要求，再点击 **生成语音**。

![实际运行的语音合成表单，使用已有语音模型，展示朗读文本和可选参数](/images/multimodal/workbench-audio.png)

不同模型支持的音色和参数可能不同。第一次使用时先保留默认值，确认请求可以完成后再调整。

切换到 **视频生成**，选择文生视频模型，填写场景与镜头描述。需要时设置画面尺寸、时长和画质，再点击 **生成视频**。

![实际运行的视频生成表单，展示已有视频模型、描述、尺寸、时长和画质选项](/images/multimodal/workbench-video.png)

切换媒体类型会重新加载模型并清空当前表单；切换模型会清空可选参数，避免把上一模型的音色、尺寸或画质误用于新模型。当前页面中已经提交的任务会保留在下方记录中。

### 4.4 查看结果与任务状态

同步返回的结果会直接显示在预览区：图片使用图片预览，语音和视频提供播放器。Base64 资源显示 **保存文件**，链接资源显示 **打开资源**，可打开后查看或保存。

如果服务返回了任务 ID，工作台会自动查询结果：

- 每次查询完成后等待 **4 秒**再查询，避免请求重叠；等待最多 **10 分钟**。
- 收到完成或失败状态后停止查询。没有可用资源的空结果会显示“未完成”，不会直接显示生成成功。
- 点击 **暂停查询** 可停止自动查询，服务端任务仍会继续；稍后点击 **继续查询** 即可恢复。
- 查询请求失败或达到等待上限时保留任务 ID，允许稍后继续查询。
- 同一时间只提交或查询一个任务。需要创建其他任务时，先等待完成，或暂停当前任务的查询。

工作台会按实际响应显示错误。下面是在本地页面提交图片请求后的真实结果：后端返回 `code=500` 和“系统异常，请联系管理员”，页面保留模型与错误信息；没有生成可预览的图片。

![真实媒体工作台请求结果，后端拒绝生成请求后显示未完成和错误信息](/images/multimodal/workbench-request-result.png)

当前后端的媒体凭据策略仍需补齐。遇到这类通用错误时，先核对[凭据接入条件](#credential-readiness)和服务端日志；不要连续点击生成来重试同一配置问题。

### 4.5 保存任务 ID，继续查看已有任务

下方 **本次任务** 最多保留当前页面的 10 条记录，点击记录可查看对应结果。记录只保存在本次页面内存中，刷新、离开页面或退出登录后会清空，自动查询也会停止。

离开页面前保存结果，或在结果区点击 **复制** 保存任务 ID，并记下对应模型。重新打开工作台后：

1. 选择与原任务一致的媒体类型和模型。
2. 展开 **查询已有任务**，填写任务 ID。
3. 点击 **查询任务**，工作台会查询结果，并在仍未完成时继续自动查询。

Atlas 图片与语音任务使用 Prediction 查询，视频任务使用通用视频查询接口。没有对应查询实现的厂商会禁用查询入口。

### 4.6 前端代码如何连接接口

工作台路由是 `/media`，入口组件位于 `ruoyi-web/src/pages/media/index.vue`。页面按职责拆分：

| 文件 | 负责的内容 |
| --- | --- |
| `components/MediaForm.vue` | 选择模型、填写三种媒体参数、查询已有任务。 |
| `components/MediaPreview.vue` | 展示结果与错误、播放音视频、保存文件、复制任务 ID。 |
| `components/MediaTasks.vue` | 展示当前页面的任务记录并切换预览。 |
| `useMediaWorkbench.ts` | 按分类加载模型、提交请求、查询任务、处理超时和页面离开。 |
| `utils.ts` | 参数校验、任务状态判断和可预览资源的检查。 |

这些组件复用 `src/api/media/index.ts` 中的 `generateImage()`、`generateSpeech()`、`generateVideo()`、`getPrediction()` 和 `getVideoResult()`。请求层自动带上登录令牌与 `ClientID`，实际结果在 RuoYi 响应的 `data` 中。例如，图片提交调用的是：

```ts
const { data } = await generateImage({
  model: selectedModel.modelName,
  prompt: draft.prompt.trim(),
  size: draft.size.trim() || undefined,
  seed: draft.seed,
});
```

工作台将模型、厂商、媒体类型与任务 ID 一起保存在任务记录中。查询时使用这条记录，不会因为用户切换了表单而查询另一个模型。离开页面或暂停查询后，迟到的响应不会覆盖新任务的结果。

模型列表来自 `GET /system/model/modelList?category=image`，语音和视频分别使用 `audio`、`video`。该接口需要 `system:model:list` 或 `coding:harness:use` 权限；不传分类时默认返回聊天模型。工作台同时检查厂商是否有对应媒体实现，不支持的选项不可提交。


## 5. 通过接口单独联调 {#verify-api}

### 5.1 准备登录身份

媒体接口需要 RuoYi AI 的登录身份。在已登录的管理端打开浏览器开发者工具，找到一条成功的后端请求，使用其中的 `Authorization` 和 `Clientid` 请求头在本地接口工具中调试。

下面的 `<ACCESS_TOKEN>` 是 **RuoYi AI 登录令牌**，`<CLIENT_ID>` 使用同一登录客户端的值。它们与服务商的媒体 Key 用途不同；调用 `/media/*` 时，服务商凭据由后端读取。

先发一个空提示词或负数种子的请求，检查登录、代理和参数校验是否到达后端。本地运行结果如下，均在调用外部服务之前被拒绝：

| 测试输入 | HTTP 状态 | 响应中的 `code` / `msg` |
| --- | --- | --- |
| 图片请求的 `prompt` 为空 | `200` | `500` / 请求参数校验失败 |
| 图片请求的 `seed` 为 `-1` | `200` | `500` / 请求参数校验失败 |
| 图片请求使用聊天模型 `deepseek-v4-flash` | `200` | `500` / 系统异常，请联系管理员 |

**HTTP 200 不等于生成成功，还要检查响应体。** 当前统一异常处理可能只返回通用提示；最后一项在控制器中的检查是模型分类不匹配，定位具体原因时需要查看服务端日志。

下面的请求展示公共接口的填写方式。真实生成需要先完成[媒体凭据接入](#credential-readiness)，并将模型名和可选参数替换为你已验证的配置。

### 5.2 生成图片 {#generate-image}

在接口工具中创建下面的 HTTP 请求：

```http
POST http://127.0.0.1:6039/media/image
Authorization: Bearer <ACCESS_TOKEN>
Clientid: <CLIENT_ID>
Content-Type: application/json

{
  "model": "openai/gpt-image-2/text-to-image",
  "prompt": "一张用于知识库应用的封面，蓝紫色线条，白色背景"
}
```

`model` 和 `prompt` 必填。需要控制尺寸时添加 `size`，格式以所选模型和适配器为准，例如 OpenAI 实现使用的 `1024x1024` 与万相 SDK 使用的 `1280*1280` 不应混用。`seed` 是可选整数，范围为 `0` 到 `2147483647`；OpenAI 图片实现遇到名称包含 `gpt-image` 的模型时会忽略它。

响应数据在 `data` 中。同步结果可能返回 `url`，也可能返回 `b64Json` 和可直接预览的 `dataUrl`；Atlas 也可能返回任务 `id` 和 `status`，这时继续查询任务。

公共 `/media/image` 请求目前没有参考图字段。它不能直接用于图生图、图片编辑，也不会读取模型备注中的“三视图、角色设定”等描述作为额外参数。

### 5.3 把文本转换为语音

向 `POST /media/speech` 发送以下 JSON，沿用前面的登录请求头：

```json
{
  "model": "替换为已配置的语音模型名称",
  "input": "欢迎使用 RuoYi AI。"
}
```

`model`、`input` 必填。可选字段为 `voice`、`responseFormat`、`speed`、`instructions`，先用最小请求验证，再按服务能力添加。

OpenAI 语音实现默认使用 `voice=alloy`、`responseFormat=mp3`，返回音频 Base64 和 `dataUrl`。Atlas 音频走异步任务。当前公共 DTO 没有多角色参考音频、采样率等字段，内部业务服务支持的参数不能直接照搬到这个接口。

### 5.4 创建视频并查询结果

向 `POST /media/video` 发送以下 JSON，同样带上登录请求头：

```json
{
  "model": "bytedance/seedance-2.0/text-to-video",
  "prompt": "镜头缓慢推进，展示桌面上的一本书，柔和自然光"
}
```

`model`、`prompt` 必填；`size`、`seconds`、`quality` 可选，取值需要符合所选模型。创建后保存返回的 `data.id` 和使用的模型名称，用它们查询结果：

```http
GET http://127.0.0.1:6039/media/video?model=<URL编码后的模型名称>&videoId=<任务ID>
Authorization: Bearer <ACCESS_TOKEN>
Clientid: <CLIENT_ID>
```

`GET /media/video` 要求模型分类为 `video`。OpenAI 实现查询 `/videos/{videoId}`；Atlas 实现把 `videoId` 作为 prediction ID 查询。

### 5.5 处理异步结果 {#async-results}

Atlas 的图片、音频和视频任务还可以使用通用查询入口：

```http
GET http://127.0.0.1:6039/media/prediction?model=<URL编码后的Atlas模型名称>&predictionId=<任务ID>
Authorization: Bearer <ACCESS_TOKEN>
Clientid: <CLIENT_ID>
```

这个入口直接调用 Atlas 查询服务，只用于 Atlas 模型。查询时沿用创建任务的模型配置，不要中途换厂商或密钥。

前后端按下面的顺序处理结果：

1. 检查 RuoYi 响应的 `code`，成功时再读取 `data`。
2. 有任务 `id` 时保存模型名、任务 ID 和当前状态；按接入厂商定义的状态判断是否还要查询。后端透传厂商状态，不能统一假设完成状态叫 `done`。
3. 设置查询间隔和超时，进入成功或失败终态就停止轮询。Atlas 查询遇到任务不存在或已过期的 `404`，当前会返回 `status=failed`。
4. 成功后检查 `dataUrl` 或 `url` 是否非空、资源能否在浏览器打开。部分适配器异常分支可能返回空结果，不能只凭 `code=200` 显示“生成完成”。

实现停止条件时，可按下面的状态表处理。Atlas 与 OpenAI 的官方状态定义分别见 [Atlas Predictions](https://www.atlascloud.ai/docs/en/predictions) 和 [OpenAI Video 对象](https://developers.openai.com/api/reference/resources/videos)。第三方兼容服务仍需核对自己的状态定义。

| 接口协议 | 等待，继续查询 | 成功，停止查询并获取资源 | 失败，停止查询 |
| --- | --- | --- | --- |
| Atlas Prediction | `processing` | `completed` | `failed` |
| OpenAI Videos | `queued`、`in_progress` | `completed` | `failed` |

仓库中的 Atlas 实现还处理了等待状态 `pending`，并在视频结果日志中兼容 `succeeded`。遇到表外状态时保留状态供排查，按超时策略结束等待，不要直接当作成功。

::: details 响应字段与当前兼容点

| 字段 | 使用方式 |
| --- | --- |
| `type`、`mimeType` | 描述媒体类型，用于选择渲染方式；还要结合实际模型分类检查。 |
| `url` | 服务返回的资源地址，注意服务自身的访问权限和有效期。 |
| `dataUrl`、`b64Json` | Base64 结果；`dataUrl` 可直接作为浏览器媒体元素的 `src`。 |
| `id`、`status` | 异步任务标识和厂商状态。 |
| `lastFrameUrl` | Atlas 视频可能返回的末帧地址，前端类型已声明，基础工作台暂不单独展示。 |
| `rawResponse` | 厂商原始响应，供服务端定位协议问题；业务页面展示处理后的状态和结果即可。 |

Atlas 通用查询目前把 `image` 以外的分类映射为 `video` / `video/mp4`，后端音频类型处理仍需补齐。工作台对链接结果使用创建任务时的媒体分类，音频仍用 `<audio>` 播放，避免被错误渲染成视频。

OpenAI 视频实现目前只提取任务响应中的 `url` 或 `data[0].url`。对接官方 Videos 接口时，还需要补上[视频内容下载](https://developers.openai.com/api/reference/resources/videos/methods/download_content)，将下载结果转换为前端可访问的资源；任务状态为 `completed`，不代表当前适配器一定能取得播放地址。

:::

## 6. 继续开发时从哪里入手 {#implementation}

### 6.1 普通聊天附件目前能做什么 {#chat-attachments}

媒体工作台用于生成媒体。回到普通聊天时，附件仍使用原有的流程：登录后进入 **新对话**，点击输入框右下方的回形针，再点击 **上传文件或图片**。下面选择了项目本地的 `logo.png`，可以看到附件预览：

![真实用户端聊天页，选择本地 logo.png 后显示图片附件预览，尚未发送消息](/images/multimodal/chat-attachment-preview.png)

`FilesSelect` 当前将文件保存在 Pinia 中，并用 `URL.createObjectURL()` 生成本地预览地址。普通聊天的 `startSSE` 没有将附件内容或地址放入 `/chat/send` 请求，因此看到这张预览图还不能进行看图问答、OCR，也不会触发 `/media/image`。

若要开发看图问答，需要继续接上文件上传或图片编码、消息中的图片字段、后端图片消息构造，以及支持视觉输入的聊天模型。它与本页的“输入文字，生成媒体”是不同的使用流程。

### 6.2 从现有实现继续扩展

后端一次图片请求的主要步骤，在 `MediaGenerationController` 中可以看到：

```java
ChatModelVo model = loadModel(request.getModel(), ModelType.IMAGE.getKey());
String result = imageServiceFactory.getOriginalService(model.getProviderCode())
    .generateImage(ImageContext.builder()
        .chatModelVo(model)
        .prompt(request.getPrompt())
        .size(request.getSize())
        .seed(request.getSeed())
        .build());
return R.ok(toImageResponse(result));
```

它先用模型名称读取配置并检查分类，再按厂商编码选实现，最后转换结果。新增媒体厂商时，需要同时接好厂商选项、凭据规则、媒体服务实现和结果解析；只增加一个下拉选项还不够。

在 `ruoyi-ai` 中可以按以下位置阅读代码：

| 要调整什么 | 代码位置 |
| --- | --- |
| 公共接口和参数 | `ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/controller/chat/MediaGenerationController.java`、同模块的 `domain/bo/media/` |
| 厂商对应的媒体实现 | 同模块的 `service/image/provider/`、`service/audio/provider/`、`service/video/provider/` |
| 地址拼接与 Atlas 查询 | 同模块的 `service/media/` |
| 按厂商选择服务 | `ruoyi-common/ruoyi-common-chat/src/main/java/org/ruoyi/common/chat/factory/` 下的三个媒体工厂 |
| 密钥引用与地址校验 | 同一公共模块的 `security/ChatModelSecretReference.java`、`ChatModelCredentialPolicy.java`、`CustomApiCredentialPolicy.java` |

如果你的目标是多模态知识库，仓库中的 `AliBaiLianMultiEmbeddingProvider` 已有文本、图片、视频及组合输入实现，但当前知识库文档入库流程尚未调用 `embedMultiModal`，还需要开发媒体入库和检索流程。

如果你的目标是给 Coding Harness 提供图片上下文，Harness 已有独立的图片附件持久化与 `ImageContent` 构造逻辑，应从它自己的会话和运行接口接入。这不会自动为普通聊天增加图片输入。

## 7. 按现象排查问题 {#troubleshooting}

| 现象 | 先检查什么 |
| --- | --- |
| 模型表单找不到厂商 | 厂商是否在当前租户启用；新环境的 Atlas、万相选项还需补充管理端静态配置。 |
| 分类选项不对或没有更新 | 检查 `chat_model_category` 的标签、键值和缓存，重新打开表单。 |
| 保存密钥失败，或调用前提示凭据不受信任 | 按[媒体凭据接入](#credential-readiness)检查厂商规则、环境变量引用和地址绑定。 |
| `Credential consumer does not match the configured provider` | 检查是否使用了 `custom_api` 回退到 `openai` 的媒体路径，需要补齐适配器与凭据身份的对应关系。 |
| 接口提示未找到模型或返回通用异常 | 请求的 `model` 是否与记录完全一致、分类是否正确、厂商是否启用；通用错误需要结合服务端日志定位。 |
| RuoYi 接口返回未登录或无权限 | 先检查登录令牌、同一客户端的 `Clientid` 和账号权限。 |
| 外部服务返回鉴权失败 | 确认请求已经到达服务商，再检查媒体 Key、服务权限和账户状态。 |
| 外部服务返回 `404` | 根据实际适配器检查基础地址与拼接路径；Atlas 查询过期任务的 `404` 会转换为失败状态。 |
| 只有任务 ID，没有资源地址 | 查询任务状态，等待完成；失败或超时后停止轮询并保留错误信息。 |
| `code=200` 但没有图片或音视频 | 继续检查 `data.status`、`data.url`、`data.dataUrl` 和服务端异常，不能直接视为生成成功。 |
| 普通聊天中找不到媒体模型，或附件没有被理解 | 聊天列表默认只查询 `chat`，附件目前只预览。生成媒体请使用左侧的“媒体工作台”，聊天图片理解仍需单独接入。 |
| 工作台暂无模型或模型加载失败 | 检查对应分类、厂商启用状态、账号的模型列表权限，并点击“刷新模型”。 |
| 工作台任务查询已暂停 | 可能是手动暂停、查询失败、未知状态或达到 10 分钟上限；保留任务 ID，排查后继续查询。 |

<details id="verification-notes">
<summary>本页截图与验证说明</summary>

截图来自本地实际运行的管理端和用户端，展示已有配置、媒体工作台、真实请求错误和聊天附件预览。工作台的成功展示与异步处理已通过模拟接口回归验证；文档截图没有将模拟响应作为外部服务生成成功结果。

</details>

<style>
.multimodal-guide .vp-doc table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}
.multimodal-guide .vp-doc th:first-child,
.multimodal-guide .vp-doc td:first-child {
  min-width: 96px;
}
.multimodal-guide .vp-doc p code,
.multimodal-guide .vp-doc li code {
  overflow-wrap: anywhere;
}
</style>
