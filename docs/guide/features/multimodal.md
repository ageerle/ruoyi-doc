---
outline: deep
---

# 多模态能力

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) 的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 概览

多模态能力覆盖图像、语音、视频等非纯文本任务。RuoYi AI 当前在 `MediaGenerationController` 中提供统一入口，再通过模型分类和厂商编码路由到不同 provider。

```text
/media/speech -> AudioServiceFactory -> OpenAIAudioGenerationServiceImpl
/media/image  -> ImageServiceFactory -> OpenAI / 通义万相 / Atlas
/media/video  -> VideoServiceFactory -> OpenAI / Atlas
```

## 接口列表

| 能力 | 接口 | 模型分类 | 说明 |
| --- | --- | --- | --- |
| 语音生成 | `POST /media/speech` | `audio` | 文本转语音，支持 voice、format、speed、instructions。 |
| 图片生成 | `POST /media/image` | `image` | 文生图，支持 prompt、size、seed。 |
| 视频生成 | `POST /media/video` | `video` | 文生视频，支持 prompt、size、seconds、quality。 |
| 视频查询 | `GET /media/video` | `video` | 根据 `videoId` 查询异步视频任务结果。 |
| Atlas 任务查询 | `GET /media/prediction` | 取决于模型 | 根据 `predictionId` 查询 Atlas 任务结果。 |

## 图片生成

请求示例：

```json
{
  "model": "wanx-image",
  "prompt": "一张科技感后台系统首页插画，清晰、明亮、适合产品文档",
  "size": "1024x1024",
  "seed": 42
}
```

返回值可能是 URL、data URL 或厂商异步任务 JSON。系统会统一转换成 `MediaGenerationResponse`。

截图占位：图片生成页面，建议放置在 `/images/multimodal/image-generate.webp`。

## 语音生成

请求示例：

```json
{
  "model": "openai-tts",
  "input": "欢迎使用 RuoYi AI。",
  "voice": "alloy",
  "responseFormat": "mp3",
  "speed": 1.0,
  "instructions": "自然、清晰、适合产品讲解"
}
```

截图占位：语音生成配置和播放页，建议放置在 `/images/multimodal/speech-generate.webp`。

## 视频生成

请求示例：

```json
{
  "model": "atlas-video",
  "prompt": "展示 RuoYi AI 知识库从文档上传到智能问答的流程",
  "size": "1280x720",
  "seconds": 5,
  "quality": "standard"
}
```

视频通常是异步生成。提交任务后先保存 `videoId` 或 `predictionId`，再通过查询接口获取结果。

截图占位：视频任务列表页，建议放置在 `/images/multimodal/video-task.webp`。

## 扩展新模态

新增模态时建议保持同一套模式：

1. 在 `ModelType` 中确认或新增模型分类。
2. 定义 request/context/response 对象。
3. 增加 provider service，实现厂商调用。
4. 注册到对应 factory。
5. 在后台模型管理中增加分类筛选和表单提示。

## 待补充

| 项目 | 说明 |
| --- | --- |
| 图片理解 | 补充视觉问答、OCR、图片输入对话的页面和接口说明。 |
| 语音识别 | 补充语音转文本模型配置和调用示例。 |
| PPT/音乐 | 预留 `ppt`、`music` 分类的能力说明。 |
