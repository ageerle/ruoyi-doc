---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
sidebar: false

hero:
  name: RuoYi AI
  text: 快速搭建属于自己的 AI 助手平台
  tagline: 全新升级，开箱即用，简单高效
  image:
    src: /hero-image.svg
    alt: RuoYi AI
  actions:
    - theme: brand
      text: 快速开始 ->
      link: /guide/introduction/projection
    - theme: alt
      text: 演示地址 ->
      link: http://web.pandarobot.chat

features:

  - icon: 🧩 
    title: 丰富模型
    details: 内置SSE、websocket等网络协议，支持对接OpenAI、DeepSeek、ChatGLM、讯飞星火等上百个大语言模型，还支持MidJourney、Stable Diffusion等绘画功能。
    link: /guide/introduction/model
    linkText: 模型集成文档

  - icon: 📚
    title: RAG支持
    details: 集成Milvus/Weaviate向量库、本地向量化模型及Ollama调用本地LLM，实现完全本地化的高效检索与生成，保障数据隐私与性能。
    link: /guide/introduction/knowledge
    linkText: RAG配置指南

  - icon: 🛠️
    title: MCP协议支持
    details: 开发者只需按照MCP标准开发一次工具接口，即可被所有支持MCP协议的模型或平台复用。通过MCP协议，AI模型能够轻松接入MCP广场1400+ mcpserver，减少了开发和维护的工作量。
    link: /guide/introduction/mcp
    linkText: MCP协议详解

  
  - icon: 🎯
    title: Dify集成
    details: 完美兼容Dify工作流，支持导入Dify应用配置，无缝迁移现有Dify项目，降低迁移成本。
    link: /guide/introduction/dify
    linkText: Dify集成指南

  - icon: 🤖
    title: Coze集成
    details: 支持Coze Bot配置导入，兼容Coze工作流格式，让您轻松迁移和管理Coze机器人。
    link: /guide/introduction/coze
    linkText: Coze集成文档

  - icon: ⚡
    title: FastGPT集成
    details: 支持FastGPT知识库格式，兼容FastGPT应用配置，实现快速迁移和无缝对接。
    link: /guide/introduction/fastgpt
    linkText: FastGPT集成

---

<VbenContributors />
