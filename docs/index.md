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
      link: /guide/getting-started/projection
    - theme: alt
      text: 演示地址 ->
      link: https://web.ruoyiai.chat

features:
  - title: 模型管理
    details: 统一管理 OpenAI、DeepSeek、通义千问、智谱、Ollama、自定义 OpenAI-compatible API 等多厂商模型。
    link: /guide/features/model
    linkText: 查看模型管理

  - title: 知识管理
    details: 覆盖文档解析、知识分块、向量化、向量库操作、召回、重排和混合检索完整 RAG 链路。
    link: /guide/features/knowledge
    linkText: 查看知识管理

  - title: 工具管理
    details: 支持 Function Calling、内置工具、本地 MCP、远程 MCP 和工具市场等能力。
    link: /guide/features/tools
    linkText: 查看工具管理

  - title: 记忆管理
    details: 管理短期记忆、长期记忆、用户记忆和全局记忆，让多轮对话具备上下文连续性。
    link: /guide/features/memory
    linkText: 查看记忆管理

  - title: 技能管理
    details: 管理 docx、pdf、xlsx 等可复用技能包，承载复杂文档处理任务。
    link: /guide/features/skills
    linkText: 查看技能管理

  - title: 智能体管理
    details: 支持 ReAct、工具调用、监督者模式和多智能体协同。
    link: /guide/features/agent
    linkText: 查看智能体管理

  - title: 上下文管理
    details: 统一组织系统提示词、会话记忆、知识片段、工具结果和输出格式约束。
    link: /guide/features/context
    linkText: 查看上下文管理

  - title: 编排管理
    details: 通过固定流程管理模型、知识库、工具、人工反馈和外部系统调用。
    link: /guide/features/orchestration
    linkText: 查看编排管理

---

<VbenContributors />
