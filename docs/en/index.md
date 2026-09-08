---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
sidebar: false

hero:
  name: RuoYi AI
  text: Build Your Own AI Assistant Platform
  tagline: Ready to use, straightforward to configure, and built for everyday development
  image:
    src: /hero-image.svg
    alt: RuoYi AI
  actions:
    - theme: brand
      text: Get Started ->
      link: /en/guide/getting-started/projection
    - theme: alt
      text: Live Demo ->
      link: https://web.ruoyiai.chat

features:
  - title: Model Management
    details: Manage models from OpenAI, DeepSeek, Qianwen, Zhipu, Ollama, and custom OpenAI-compatible APIs in one place.
    link: /en/guide/features/model
    linkText: Configure models

  - title: Platform Integration
    details: Connect FastGPT, RAGFlow, and OpenAI- or Anthropic-compatible services. Dify and Coze adapters require additional provider options and credential support.
    link: /en/guide/features/models-platforms-integration
    linkText: Connect a platform

  - title: Multimodal & Media
    details: Explore provider routing and APIs for images, speech, video, and predictions, including the current limits of attachments in ordinary chat.
    link: /en/guide/features/multimodal
    linkText: Explore media capabilities

  - title: Knowledge Base
    details: Follow the RAG pipeline from document parsing and chunking to embeddings, vector storage, retrieval, reranking, and hybrid search.
    link: /en/guide/features/knowledge
    linkText: Set up retrieval

  - title: Tool Management
    details: Use Function Calling, built-in Java tools, local and remote MCP servers, and tool marketplaces.
    link: /en/guide/features/tools
    linkText: Configure tools

  - title: MCP Management
    details: Learn the protocol, connect LOCAL and REMOTE servers or ModelScope services, and verify agent tool calls with backend diagnostics.
    link: /en/guide/features/mcp
    linkText: Connect MCP services

  - title: Skills
    details: Manage docx, pdf, and xlsx resources, with clear distinctions between chat selections and execution through Coding Harness.
    link: /en/guide/features/skills
    linkText: Understand skills

  - title: Context Management
    details: Understand prompts, history, and retrieved passages. Verify the 20-message window and extend persistence or long-term memory with LangChain4j examples.
    link: /en/guide/features/context
    linkText: Explore context and memory

  - title: Agents
    details: Use a LangChain4j Supervisor to coordinate search, SQL, charts, ECharts, and conversation, with knowledge retrieval and MCP tools.
    link: /en/guide/features/agent
    linkText: Build an agent

  - title: Workflow Orchestration
    details: Design and run model, retrieval, and branching workflows visually over SSE. Initialize optional nodes for mail, HTTP, and images as needed.
    link: /en/guide/features/orchestration
    linkText: Design a workflow

---

<VbenContributors />
