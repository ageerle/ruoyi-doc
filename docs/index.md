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
  - icon: 🌐
    title: 模型与平台集成
    details: 支持通用模型、Dify、Coze、FastGPT等多种AI平台与工作流的无缝集成。
    link: /guide/introduction/models-platforms-integration
    linkText: 集成指南

  - icon: 📚
    title: RAG支持
    details: 集成Milvus/Weaviate向量库、本地向量化模型及Ollama调用本地LLM，实现完全本地化的高效检索与生成，保障数据隐私与性能。
    link: /guide/introduction/knowledge
    linkText: RAG配置指南

  - icon: 🛠️
    title: MCP协议支持
    details: 开发者只需按照MCP标准开发一次工具接口，即可被所有支持MCP协议的模型或平台复用。
    link: /guide/introduction/mcp
    linkText: MCP协议详解

---

<VbenContributors />
