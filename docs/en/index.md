---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
sidebar: false

hero:
  name: RuoYi AI
  text: Build Your Own AI Assistant Platform
  tagline: Ready to use out of the box, simple and efficient
  image:
    src: /hero-image.svg
    alt: RuoYi AI
  actions:
    - theme: brand
      text: Get Started ->
      link: /en/guide/getting-started/projection
    - theme: alt
      text: Live Demo ->
      link: http://web.pandarobot.chat

features:
  - icon: 🌐
    title: Model & Platform Integration
    details: Seamless integration with various AI platforms and workflows including general models, Dify, Coze, FastGPT, and more.
    link: /en/guide/features/models-platforms-integration
    linkText: Integration Guide

  - icon: 📚
    title: RAG Support
    details: Integrated with Milvus/Weaviate vector databases, local embedding models, and Ollama for local LLM inference. Fully local, efficient retrieval and generation with data privacy.
    link: /en/guide/features/knowledge
    linkText: RAG Configuration

  - icon: 🛠️
    title: MCP Protocol Support
    details: Developers build tool interfaces once following the MCP standard, and they can be reused by all MCP-compatible models and platforms.
    link: /en/guide/features/mcp
    linkText: MCP Protocol Guide

  - icon: 💻
    title: AI Coding
    details: Learn Claude Code tutorials from beginner to advanced, mastering best practices for AI-assisted programming.
    link: /en/guide/ai-coding/claude-code-beginner
    linkText: Start Learning

---

<VbenContributors />
