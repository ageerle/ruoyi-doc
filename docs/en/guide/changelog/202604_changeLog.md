---
outline: [2, 3]
prev: false
next: false
---

# 2026-04 ruoyi-ai Changelog

Version 3.0, document skills, providers and retrieval.

Based on **14 main-branch commits and merges** in this month, verified on **2026-09-08**. See the [scope and archive](./index.md#scope).

## Key changes

- Update version 3.0 code, upgrade LangChain4j to 1.13.0, and add docx/pdf/xlsx skill resources and demo-mode interception. [c1fc0289](https://github.com/ageerle/ruoyi-ai/commit/c1fc02894b1dc6f4689028128df0cc36b0b804d1)
- Merge improvements to retrieval testing, hybrid retrieval, asynchronous document parsing and user-facing knowledge-base chat. [9a7b7274](https://github.com/ageerle/ruoyi-ai/commit/9a7b727413177383274ff2c440a0cba767ceb866)
- Add reranking support and SQL for Qwen reranking models. [07bdc5e5](https://github.com/ageerle/ruoyi-ai/commit/07bdc5e585111181fa527e901741686e8ac2f7e1)
- Add a Zhipu embedding-model implementation. [74eb5b25](https://github.com/ageerle/ruoyi-ai/commit/74eb5b2530ef7741ec8f054a9fb0dd237bb10c2d)
- Add provider support for Xiaomi MiMo, DeepSeek and custom providers. [4f79a665](https://github.com/ageerle/ruoyi-ai/commit/4f79a66559e59e445ba7465d8c4675acb5211bcc)
- Integrate MiniMax as a model provider and add listener support. [081da6d1](https://github.com/ageerle/ruoyi-ai/commit/081da6d18da4df098736bb21fca44a2f1c8760b6)
- Correct context-message ordering so history and the current question reach the model in the intended order. [bf7b5eac](https://github.com/ageerle/ruoyi-ai/commit/bf7b5eac721edb9a091017d5167afbc4b2245227)
- Fix execution issues in docker-compose-all.yaml. [c4f7c1f5](https://github.com/ageerle/ruoyi-ai/commit/c4f7c1f5d0e9898e9ff00d3c195d2cd80dd2d466)

---

[Newer：2026-05](./202605_changeLog.md) · [All changelogs](./index.md) · [Older：2026-03](./202603_changeLog.md)
