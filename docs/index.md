---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
sidebar: false

hero:
  name: RuoYi AI
  text: 快速搭建属于自己的 AI 助手平台
  tagline: 全新升级，开箱即用，简单高效
  # image:
  #   src: http://43.139.70.230:6553/down/NKHMAAGIetJG.png
  #   alt: RuoYi AI
  actions:
    - theme: brand
      text: 快速开始 ->
      link: /guide/introduction/index

features:
  - icon: 📦
    title: 全套开源系统
    details: 提供完整的前端应用、后台管理以及小程序应用，全部开箱即用。基于MIT开源协议，自由度高，可灵活修改和分发代码
    link: /guide/introduction/license
    linkText: 查看开源协议
  - icon: 📚
    title: 本地RAG解决方案
    details: 集成Milvus/Weaviate向量库、本地向量化模型及Ollama调用本地LLM，实现完全本地化的高效检索与生成，保障数据隐私与性能。
    link: /guide/introduction/knowledge
    linkText: 本地RAG方案
  - icon: 🔌
    title: MCP协议支持
    details: 开发者只需按照MCP标准开发一次工具接口，即可被所有支持MCP协议的模型或平台复用。通过MCP协议，AI模型能够轻松接入MCP广场1400+ mcpserver，减少了开发和维护的工作量。
    link: /guide/introduction/mcp
    linkText: MCP协议
  
  - icon: 🦄
    title: 丰富的模型集成
    details: 内置SSE、websocket等网络协议，支持对接OpenAI、DeepSeek、ChatGLM、讯飞星火等上百个大语言模型，还支持MidJourney、Stable Diffusion等绘画功能.
    link: /guide/introduction/model
    linkText: 模型集成文档

  - icon: 📱
    title: 微信扩展功能
    details: 支持接入个人微信或企业微信，方便与微信生态深度整合，拓展应用场景
    link: /guide/introduction/weixin
    linkText: 微信扩展

  - icon:  💳
    title: 支付功能
    details: 支持微信支付、易支付等多种主流支付方式，满足不同场景的支付需求，让交易更加便捷高效。
    link: /guide/introduction/pay
    linkText: 功能文档

---

<VbenContributors />
