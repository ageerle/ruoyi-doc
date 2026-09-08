---
outline: deep
pageClass: multimodal-guide
---

# Multimodal and media capabilities {#多模态与媒体能力}

RuoYi AI provides image generation, text-to-speech, and video generation APIs, with a **Media Workspace** in the user app for choosing models, entering parameters, and viewing results. This page covers capabilities and concepts first, followed by model configuration, workspace usage, and API checks.

## Capabilities {#capabilities}

| Capability | Input and result | Entry point |
| --- | --- | --- |
| **Image generation** | Generate an image from text, with model-dependent size and seed options. | **Image generation** or `POST /media/image`. |
| **Text-to-speech** | Generate audio from text, with model-dependent voice, format, and speed. | **Speech synthesis** or `POST /media/speech`. |
| **Video generation** | Submit a scene and camera description, then query the generated video. | **Video generation** or `POST /media/video`. |
| **Task lookup and previews** | Check asynchronous progress, preview images, play audio/video, and save results or task IDs. | Result panel, **Current tasks**, and **Query existing task**. |

The pages and APIs exist, but **actual generation still requires backend media-credential integration and a usable provider/model configuration**. See [Credential requirements](#credential-readiness). Optional parameters and query methods also depend on the provider.

Image attachments in ordinary chat currently support only local previews, without image understanding or OCR. The workspace does not yet offer reference-image uploads or image editing. See [Chat attachments and extension](#chat-attachments).

## Multimodality and media generation {#concepts}

**Multimodality** means processing information in forms such as text, images, audio, and video. It includes understanding an input image as well as generating media from text. This guide focuses on the latter: **media generation**.

| Concept | Meaning here |
| --- | --- |
| **Provider and model** | The provider selects the service and protocol; the model name selects a specific model on that service. |
| **Model category** | `image`, `audio`, and `video` determine where a model appears. The category must match its actual capability. |
| **Synchronous result** | One request returns a resource that can be displayed immediately. |
| **Asynchronous task** | The initial response returns a task ID; generation continues on the server and status queries retrieve the result. |

For first use, prepare the provider and credentials, configure a model, submit through the workspace, then inspect or query the result. Sections 1–3 cover setup; section 4 covers the [workspace](#frontend-use), and section 5 covers [API debugging](#verify-api).

## 1. Start the admin console and find media models {#start-admin}

Start the backend using [Local installation](../getting-started/install.md), then start the admin console:

```powershell
Set-Location D:\Project\github\ruoyi-admin
pnpm install
pnpm run dev:antd
```

Replace the path and skip dependency installation if already complete. Open the terminal's URL, normally [http://localhost:5666](http://localhost:5666), and go to **Chat Management → Model Management**. The development proxy and API examples use backend `http://127.0.0.1:6039`.

Search for the model you intend to use before adding a new record. This existing Atlas Cloud model illustrates the fields:

![Model list filtered by gpt-image, showing Atlas Cloud image models](/images/multimodal/image-model-list.png)

Although the model name starts with `openai/`, its provider is `atlas`, so the backend uses the Atlas adapter. **The provider selects the service; the model name selects a model on that service.** An image-editing model in the list does not mean the public generation API accepts reference images.

## 2. Check provider and credential requirements {#configure-provider}

### 2.1 Inspect the service in Provider Management {#_2-1-在厂商管理中检查服务}

Open **Chat Management → Provider Management** and check the code and enabled status. Model forms load enabled providers only, and disabling a provider rejects new calls for existing models too. See [Provider configuration](./model.md#configure-provider).

These are the **adapter mappings currently in code**; credential readiness must also be checked:

| Code | Existing media implementations | Considerations |
| --- | --- | --- |
| `openai` | Images, speech, video creation and lookup | The service must implement media endpoints, not just compatible chat. |
| `atlas` | Images, audio, video, asynchronous lookup | Use the complete Atlas model ID. |
| `Tongyiwanx` | Tongyi Wanxiang text-to-image | Case-sensitive code; uses the Wanxiang SDK. |
| `custom_api` | Factory fallback to OpenAI media | Fallback and credential validation currently do not match; custom chat configuration cannot be reused directly. |

`custom_anthropic` has no media-generation adapter. Working chat providers such as DeepSeek, PPIO, or Ollama do not imply media support.

If Atlas Cloud is missing, check for an enabled `atlas` provider in the current tenant. The admin's static Add Provider options currently omit `atlas` and `Tongyiwanx`. A fresh environment must add them in `ruoyi-admin/apps/web-antd/src/views/chat/provider/options.ts` before creating records. The screenshots use an existing Atlas provider.

### 2.2 Requirements before calling a provider {#credential-readiness}

Obtain the API address, actual model ID, and a key authorized for media, then ensure the backend can resolve credentials for that provider.

::: warning Media credentials still require implementation
Model saving requires a trusted environment-variable reference rather than a plaintext key. Existing rules cover DeepSeek, PPIO, and the two custom chat protocols, but not `openai`, `atlas`, or `Tongyiwanx` media credentials.

Also, `custom_api` media requests fall back to an adapter that resolves credentials as `openai`. That differs from the configured `custom_api` provider and fails validation. Selecting Custom OpenAI and entering an API host is therefore insufficient.
:::

Before testing generation, implement:

1. Allowed provider-specific references in `ChatModelSecretReference`.
2. Save-time and call-time checks in `ChatModelCredentialPolicy` for provider, address, model, and reference, binding credentials to the consuming service address.
3. Credential resolution under the configured protocol identity for custom OpenAI media, retaining the appropriate address binding.
4. Checks for valid configurations, wrong addresses/providers, and missing variables; then rebuild and restart Java.

References have the form `env:VARIABLE_NAME`. Existing custom chat, for example, uses `env:CUSTOM_OPENAI_API_KEY`, resolved from the Java environment. Media providers need their allowed names defined in code first.

Put real keys in the **Java process's environment**, through IDE launch settings or container variables, and restart the backend. Enter only the reference in model forms. A `ruoyi-web` `.env` does not supply the backend and should not contain provider keys.

These are implementation requirements. Initialization placeholders, existing model rows, and empty key fields do not establish readiness.

## 3. Configure categories and models {#configure-model}

### 3.1 Check model categories {#_3-1-确认模型分类}

Under **System Management → Dictionary Management**, find **Model Category**, type `chat_model_category`:

| Label | Value | API |
| --- | --- | --- |
| Image | `image` | `POST /media/image` |
| Speech / Audio | `audio` | `POST /media/speech` |
| Video | `video` | `POST /media/video`, `GET /media/video` |

Add missing entries, refresh the dictionary cache, and reopen the model form. The current form also supplies these three categories when dictionary entries are missing, but labels and ordering should be maintained in the dictionary. See [Model category dictionary](./model.md#model-category-dict).

![Model category selector with image, audio, and video values](/images/multimodal/media-categories.png)

Labels can change; stored values must remain stable. Changing a chat model's category to `image` does not give it image-generation capability.

### 3.2 Configure an image model {#_3-2-配置一个图片模型}

Return to **Chat Management → Model Management** and edit an existing row or add one using the confirmed provider. This existing Atlas text-to-image configuration illustrates the fields:

![Atlas image model form with provider, category, name, and request address](/images/multimodal/image-model-form.png)

| Field | Screenshot value | How to fill it |
| --- | --- | --- |
| Provider | Atlas Cloud | Enabled `atlas` provider. |
| Category | Image | Stored as `image`. |
| Model name | `openai/gpt-image-2/text-to-image` | Actual service model ID, also sent as request `model`. |
| Description | GPT-IMAGE-2 text-to-image | Display name; does not replace the API model name. |
| Request address | `https://api.atlascloud.ai/v1` | Base URL; the adapter constructs the endpoint. |
| Key | Not returned in the edit form | An allowed environment reference after implementing media credentials. |
| Notes | Model-purpose description | Maintenance text, not generation parameters. |

Selecting a regular provider copies its address into the model form. If the provider address changes later, check existing model addresses too. Complete credential integration before saving a usable configuration, then verify provider, category, and model name in the list.

::: details How endpoints are constructed
- OpenAI media uses `OpenAiMediaSupport.endpoint()` for `/v1/images/generations`, `/v1/audio/speech`, and `/v1/videos`, avoiding duplicate `/v1`.
- Atlas uses `AtlasMediaSupport.endpoint()` and `/api/v1`. For example, prediction lookup converts the shown base URL to `https://api.atlascloud.ai/api/v1/model/prediction/{id}`.
- Wanxiang uses the `ImageSynthesis` SDK without using model `apiHost` when building parameters. Another endpoint requires an SDK integration change.
:::

### 3.3 Configure speech or video models {#_3-3-配置语音或视频模型}

Use category **Audio / `audio`** and the provider's speech model ID. `voice`, format, and speed belong in generation requests, not model notes.

For video, use **Video / `video`**. The existing example uses `bytedance/seedance-2.0/text-to-video`:

![Atlas video model form with category video](/images/multimodal/video-model-form.png)

Each record has one category. Verify one media capability first to make address, parameter, and credential problems easier to isolate.

## 4. Generate and inspect media in the workspace {#frontend-use}

### 4.1 Open the workspace {#_4-1-打开工作台}

Start the user frontend, using a separate port when the documentation site is running:

```powershell
Set-Location D:\Project\github\ruoyi-web
pnpm install
pnpm run dev --port 5180
```

Open [http://localhost:5180/media](http://localhost:5180/media), or select **Media Workspace** in the user app sidebar. Sign in when prompted; models load after login.

The **Image generation**, **Speech synthesis**, and **Video generation** tabs load `image`, `audio`, and `video` models respectively. After saving a model in the admin console, click **Refresh models**. Empty lists prompt administrators to check category and provider status.

The workspace collects parameters and displays tasks and results. The backend still supplies service addresses and keys. Complete [media credentials](#credential-readiness) before generating.

### 4.2 Generate an image {#_4-2-生成一张图片}

1. Select **Image generation** and a text-to-image model. Provider code and full model name are shown below the selector.
2. Describe the subject, scene, and style in **Prompt**, or insert and edit the example.
3. Expand **More parameters** for size and seed if needed; empty values use model defaults.
4. Click **Generate image** and inspect the right-side status and result.

![Running image workspace with an Atlas model and prompt, before submission](/images/multimodal/workbench-image.png)

Options display model descriptions, falling back to names. This workspace supports text-to-image, without reference-image upload or editing. Choose a generation model even if editing models appear in the list.

### 4.3 Generate speech or video {#_4-3-合成语音或生成视频}

Select **Speech synthesis**, choose a model, and enter the text to read. Under **More parameters**, optionally set voice, audio format, speed, and reading instructions, then click **Generate speech**.

![Speech form with an existing model, input text, and optional parameters](/images/multimodal/workbench-audio.png)

Supported voices and parameters vary. Begin with defaults, verify a successful request, then tune them.

Select **Video generation**, choose a text-to-video model, and describe the scene and camera movement. Optionally set size, duration, and quality, then click **Generate video**.

![Video form with model, prompt, size, duration, and quality options](/images/multimodal/workbench-video.png)

Changing media type reloads models and clears the form. Changing models clears optional parameters to avoid reusing incompatible options. Already-submitted tasks remain in the current page's task list.

### 4.4 Inspect results and task status {#_4-4-查看结果与任务状态}

Synchronous resources appear immediately as images or audio/video players. Base64 results offer **Save file**; URL results offer **Open resource**.

When a task ID is returned, the workspace polls automatically:

- Waits **4 seconds after each query completes**, with a **10-minute** limit.
- Stops on completion or failure. An empty result without a usable resource is shown as incomplete.
- **Pause polling** stops client queries while the server task continues; **Resume polling** resumes later.
- Retains the task ID after query errors or timeout.
- Submits or polls one task at a time. Wait or pause polling before creating another.

Errors reflect actual responses. The local image request below returned backend `code=500` and a generic system-error message; the model and error remained visible, with no generated image:

![Actual failed generation request in the media workspace](/images/multimodal/workbench-request-result.png)

The backend's media credential policy still needs completion. Check [credential readiness](#credential-readiness) and server logs for generic errors instead of repeatedly retrying the same configuration.

### 4.5 Save a task ID and resume an existing task {#_4-5-保存任务-id-继续查看已有任务}

**Current tasks** retains up to ten records in page memory. Selecting a record shows its result. Refreshing, leaving the page, or signing out clears records and stops polling.

Before leaving, save the result or **Copy** the task ID and note its model. To resume:

1. Choose the original media type and model.
2. Expand **Query existing task** and enter the ID.
3. Click **Query task**; polling continues if the task is still running.

Atlas images and speech use Prediction lookup; videos use the generic video query endpoint. Providers without a lookup implementation have this entry disabled.

### 4.6 Frontend API integration {#_4-6-前端代码如何连接接口}

The route is `/media`, with entry component `ruoyi-web/src/pages/media/index.vue`:

| File | Responsibility |
| --- | --- |
| `components/MediaForm.vue` | Models, media parameters, and existing-task queries. |
| `components/MediaPreview.vue` | Results, errors, playback, saving, and copying IDs. |
| `components/MediaTasks.vue` | Current-page task list and preview selection. |
| `useMediaWorkbench.ts` | Model loading, submission, queries, timeouts, and navigation cleanup. |
| `utils.ts` | Parameter checks, task states, and usable-resource validation. |

These reuse `generateImage()`, `generateSpeech()`, `generateVideo()`, `getPrediction()`, and `getVideoResult()` from `src/api/media/index.ts`. The request layer includes the login token and `ClientID`; actual results are in response `data`. For example:

```ts
const { data } = await generateImage({
  model: selectedModel.modelName,
  prompt: draft.prompt.trim(),
  size: draft.size.trim() || undefined,
  seed: draft.seed,
});
```

Task records retain model, provider, category, and ID so changing the form does not query a different model. Late responses after navigation or paused polling cannot overwrite a newer task.

Models come from `GET /system/model/modelList?category=image`, or `audio` / `video`. It requires `system:model:list` or `coding:harness:use`; omitting category defaults to chat. The workspace also checks provider media implementations and blocks unsupported submissions.

## 5. Test the APIs independently {#verify-api}

### 5.1 Prepare application authentication {#_5-1-准备登录身份}

Media APIs require a RuoYi AI login. In browser developer tools, inspect a successful backend request and use its `Authorization` and `Clientid` headers in your local API client.

`<ACCESS_TOKEN>` below is the **RuoYi AI login token**; `<CLIENT_ID>` belongs to that login client. They differ from provider media keys, which the backend resolves for `/media/*` requests.

First send an empty prompt or negative seed to check authentication, proxying, and validation without calling a provider. Recorded results:

| Test | HTTP | Response `code` / message |
| --- | --- | --- |
| Empty image `prompt` | `200` | `500` / parameter validation failed |
| Image `seed=-1` | `200` | `500` / parameter validation failed |
| Image request using chat model `deepseek-v4-flash` | `200` | `500` / generic system error |

**HTTP 200 does not mean generation succeeded.** Inspect the body. The last case is a category mismatch in the controller, but generic exception handling may hide the detail; consult server logs.

The following requests show the public API format. Actual generation requires [credential integration](#credential-readiness), a verified model, and valid options.

### 5.2 Generate an image {#generate-image}

Create this HTTP request in your API client:

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

`model` and `prompt` are required. Optional `size` must match the model and adapter: OpenAI's `1024x1024` and Wanxiang's `1280*1280` are not interchangeable. Optional integer `seed` ranges from `0` to `2147483647`; the OpenAI image adapter ignores it for names containing `gpt-image`.

Response `data` may contain a synchronous `url`, `b64Json`, or directly previewable `dataUrl`. Atlas may instead return task `id` and `status`, requiring a query.

`/media/image` has no reference-image field. It does not support image-to-image or editing and does not convert model notes into extra parameters.

### 5.3 Convert text to speech {#_5-3-把文本转换为语音}

Send this JSON to `POST /media/speech` with the same login headers:

```json
{
  "model": "替换为已配置的语音模型名称",
  "input": "欢迎使用 RuoYi AI。"
}
```

`model` and `input` are required. `voice`, `responseFormat`, `speed`, and `instructions` are optional. Verify a minimal request first.

The OpenAI adapter defaults to `voice=alloy` and `responseFormat=mp3`, returning Base64 and `dataUrl`. Atlas audio is asynchronous. The public DTO has no multi-speaker reference audio or sample-rate fields; parameters from internal business services cannot simply be copied here.

### 5.4 Create and query a video {#_5-4-创建视频并查询结果}

Send to `POST /media/video` with the login headers:

```json
{
  "model": "bytedance/seedance-2.0/text-to-video",
  "prompt": "镜头缓慢推进，展示桌面上的一本书，柔和自然光"
}
```

`model` and `prompt` are required; `size`, `seconds`, and `quality` must match the chosen model. Retain `data.id` and the model name for querying:

```http
GET http://127.0.0.1:6039/media/video?model=<URL编码后的模型名称>&videoId=<任务ID>
Authorization: Bearer <ACCESS_TOKEN>
Clientid: <CLIENT_ID>
```

`GET /media/video` requires category `video`. OpenAI queries `/videos/{videoId}`; Atlas treats `videoId` as a prediction ID.

### 5.5 Handle asynchronous results {#async-results}

Atlas image, audio, and video tasks also support generic lookup:

```http
GET http://127.0.0.1:6039/media/prediction?model=<URL编码后的Atlas模型名称>&predictionId=<任务ID>
Authorization: Bearer <ACCESS_TOKEN>
Clientid: <CLIENT_ID>
```

This directly calls Atlas and is only for Atlas models. Use the same model configuration, provider, and credentials as creation.

1. Check the RuoYi response `code` before reading `data`.
2. Retain model, task ID, and status. Interpret states by provider; the backend passes them through, so do not assume completion is named `done`.
3. Use an interval and timeout, stopping on success or failure. Atlas lookup converts missing or expired task `404` responses to `status=failed`.
4. Confirm `dataUrl` or `url` is nonempty and accessible. Some adapter error branches return an empty result; `code=200` alone cannot mean completion.

See [Atlas Predictions](https://www.atlascloud.ai/docs/en/predictions) and the [OpenAI Video object](https://developers.openai.com/api/reference/resources/videos). Check third-party compatible services separately.

| Protocol | Continue polling | Success | Failure |
| --- | --- | --- | --- |
| Atlas Prediction | `processing` | `completed` | `failed` |
| OpenAI Videos | `queued`, `in_progress` | `completed` | `failed` |

The Atlas code also handles `pending` and recognizes `succeeded` in video result logs. Preserve unknown states for diagnosis and apply a timeout; do not assume success.

::: details Response fields and compatibility notes

| Field | Use |
| --- | --- |
| `type`, `mimeType` | Media type for rendering; also check the configured model category. |
| `url` | Provider resource URL, subject to its permissions and expiry. |
| `dataUrl`, `b64Json` | Base64 output; `dataUrl` can be a browser media element's `src`. |
| `id`, `status` | Task identifier and provider state. |
| `lastFrameUrl` | Possible Atlas video final frame; typed in the frontend but not shown separately in the basic workspace. |
| `rawResponse` | Original provider response for server-side protocol diagnosis. |

Atlas generic lookup currently maps all non-image categories to `video` / `video/mp4`; backend audio handling still needs correction. For URL resources, the workspace uses the creation-time category so audio renders with `<audio>`.

The OpenAI video adapter only extracts `url` or `data[0].url`. The official Videos API also requires [content download](https://developers.openai.com/api/reference/resources/videos/methods/download_content) and conversion into a frontend-accessible resource. `completed` does not guarantee this adapter can obtain a playback URL.
:::

## 6. Where to extend the implementation {#implementation}

### 6.1 Current chat attachment behavior {#chat-attachments}

The workspace generates media. Ordinary chat uses a separate attachment flow: sign in, open **New conversation**, click the paperclip and **Upload file or image**. Selecting local `logo.png` shows a preview:

![Ordinary chat with a local logo.png preview before sending](/images/multimodal/chat-attachment-preview.png)

`FilesSelect` stores files in Pinia and creates previews with `URL.createObjectURL()`. Ordinary chat's `startSSE` does not include attachment content or URLs in `/chat/send`, so the preview does not enable visual question answering or OCR and does not call `/media/image`.

Image understanding needs upload or encoding, image fields in messages, backend image-message construction, and a vision-capable chat model. It is a separate flow from text-to-media generation.

### 6.2 Extend existing implementations {#_6-2-从现有实现继续扩展}

The image path in `MediaGenerationController` follows these steps:

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

It looks up the model, checks its category, selects an implementation by provider, and converts the result. A new media provider needs options, credential rules, service implementations, and result parsing together.

| Area | Code location in `ruoyi-ai` |
| --- | --- |
| Public APIs and parameters | `ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/controller/chat/MediaGenerationController.java` and that module's `domain/bo/media/`. |
| Provider implementations | That module's `service/image/provider/`, `service/audio/provider/`, `service/video/provider/`. |
| Endpoint construction and Atlas lookup | That module's `service/media/`. |
| Service selection | Three media factories under `ruoyi-common/ruoyi-common-chat/src/main/java/org/ruoyi/common/chat/factory/`. |
| References and address validation | The common module's `security/ChatModelSecretReference.java`, `ChatModelCredentialPolicy.java`, and `CustomApiCredentialPolicy.java`. |

For multimodal knowledge bases, `AliBaiLianMultiEmbeddingProvider` supports text, images, video, and combined inputs, but document ingestion does not call `embedMultiModal` yet. Media ingestion and retrieval require further work.

Coding Harness has its own image persistence and `ImageContent` construction. Use its session/run APIs for image context; this does not automatically enable images in ordinary chat.

## 7. Troubleshooting {#troubleshooting}

| Symptom | First check |
| --- | --- |
| Provider missing | Enabled status and tenant; fresh Atlas/Wanxiang setups need static admin options. |
| Wrong or stale categories | `chat_model_category` labels, values, and cache; reopen the form. |
| Credential save fails or is untrusted | [Provider rules, references, and URL binding](#credential-readiness). |
| `Credential consumer does not match the configured provider` | `custom_api` fallback to `openai`; align adapter identity and credential policy. |
| Model not found or generic exception | Exact name, category, enabled provider, and server logs. |
| Unauthenticated or forbidden RuoYi response | Login token, matching `Clientid`, and permissions. |
| Provider authentication failure | Confirm the request reached the provider, then check key, media access, and account status. |
| Provider `404` | Adapter endpoint construction; expired Atlas task lookup becomes a failed state. |
| Task ID but no resource | Poll until completion, failure, or timeout, retaining error details. |
| `code=200` without media | Inspect `data.status`, `url`, `dataUrl`, and server exceptions. |
| Media models absent in chat or attachments ignored | Chat defaults to `chat` models and attachment previews only; use Media Workspace for generation. |
| Workspace models missing or fail to load | Category, provider status, model-list permission, and **Refresh models**. |
| Polling paused | Manual pause, query failure, unknown state, or the 10-minute limit; retain the ID and resume after diagnosis. |

<details id="verification-notes">
<summary>Screenshot and verification notes</summary>

Screenshots show the locally running applications, existing settings, workspace forms, an actual request error, and chat attachment previews. Successful rendering and asynchronous handling were regression-checked with simulated APIs; those simulated responses are not presented as successful external generation screenshots.

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
