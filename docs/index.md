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
    - theme: alt
      text: 中转API
      link: https://api.pandarobot.chat/

features:
  - icon: 📦
    title: 全套开源系统
    details: 提供完整的前端应用、后台管理以及小程序应用，全部开箱即用。基于MIT开源协议，自由度高，可灵活修改和分发代码
    link: /guide/introduction/roadmap
    linkText: 查看开源协议
  - icon: 📚
    title: 本地RAG解决方案
    details: 集成Milvus/Weaviate向量库、本地向量化模型及Ollama调用本地LLM，实现完全本地化的高效检索与生成，保障数据隐私与性能。
    link: /guide/introduction/roadmap
    linkText: 本地RAG方案
  - icon: 📡
    title: 丰富插件功能
    details: 支持联网插件、SQL查询插件及Text2API插件，扩展系统能力，满足多样化需求，提升应用场景灵活性。
    link: //guide/plugins/overview
    linkText: 插件功能
  - icon: 🦄
    title: 丰富的模型集成
    details: 内置SSE、websocket等网络协议，支持对接OpenAI、Azure、ChatGLM、讯飞星火、文心一言等上百个大语言模型，还集成了MidJourney、Stable Diffusion和DALLE AI绘画功能.
    link: /guide/introduction/roadmap
    linkText: 模型集成文档
  - icon: 📱
    title: 微信扩展功能
    details: 支持接入个人微信或企业微信，方便与微信生态深度整合，拓展应用场景
    link: //guide/introduction/roadmap
    linkText: 微信扩展
  - icon: 🎬
    title: 强大的多媒体功能
    details: 支持AI翻译、AI PPT制作、语音克隆和AI翻唱，满足多种多媒体需求。
    link: /guide/introduction/roadmap
    linkText: 功能文档

---

<VbenContributors />
