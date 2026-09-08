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

  - title: 平台接入
    details: 接入 FastGPT、RAGFlow 及 OpenAI / Anthropic 兼容服务，按平台说明配置步骤；Dify、Coze 提供适配代码，需补齐厂商选项与凭据支持。
    link: /guide/features/models-platforms-integration
    linkText: 查看平台接入

  - title: 多模态接口
    details: 说明图片、语音、视频和预测接口的 Provider 路由、调用方式，以及当前普通聊天附件尚未接通的边界。
    link: /guide/features/multimodal
    linkText: 查看多模态接口

  - title: 知识管理
    details: 覆盖文档解析、知识分块、向量化、向量库操作、召回、重排和混合检索完整 RAG 链路。
    link: /guide/features/knowledge
    linkText: 查看知识管理

  - title: 工具管理
    details: 支持 Function Calling、内置工具、本地 MCP、远程 MCP 和工具市场等能力。
    link: /guide/features/tools
    linkText: 查看工具管理

  - title: MCP 管理
    details: 从协议概念到 LOCAL、REMOTE 和魔搭 ModelScope 实战，结合后端源码完成智能体工具调用、排障与扩展。
    link: /guide/features/mcp
    linkText: 查看 MCP 管理

  - title: 技能管理
    details: 管理 docx、pdf、xlsx 等技能资源，并区分普通聊天选择器与 Coding Harness 的真实执行链路。
    link: /guide/features/skills
    linkText: 查看技能管理

  - title: 上下文管理
    details: 理解系统提示词、会话历史和知识片段的组装，验证最近 20 条历史记忆，并通过 LangChain4j 示例扩展窗口、持久化和长期记忆。
    link: /guide/features/context
    linkText: 查看上下文管理

  - title: 智能体管理
    details: 基于 LangChain4j Supervisor 编排网页搜索、SQL、图表、ECharts 和闲聊角色，可预检索知识库并绑定 MCP。
    link: /guide/features/agent
    linkText: 查看智能体管理

  - title: 流程编排
    details: 通过可视化节点和 SSE 运行模型、知识检索、条件分支、邮件、HTTP、网络搜索和图片生成流程。
    link: /guide/features/orchestration
    linkText: 查看流程编排

---

<VbenContributors />
