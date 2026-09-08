---
outline: [2, 3]
prev: false
next: false
---

# 2026-07 ruoyi-ai Changelog

Workflow routing, unified RAG, media and tracing.

Based on **24 main-branch commits and merges** in this month, verified on **2026-09-08**. See the [scope and archive](./index.md#scope).

## Key changes

- Separate model, agent and workflow chat execution, integrate Zhipu web search, and remove obsolete workflow nodes and resume handling. [6e264ad5](https://github.com/ageerle/ruoyi-ai/commit/6e264ad5003fd5781144fee789722fa63bedcbcb)
- Unify knowledge splitting, retrieval thresholds, reranking and caching; improve vector-store routing, document reparsing and vector lifecycle handling. [46a8d6b5](https://github.com/ageerle/ruoyi-ai/commit/46a8d6b5526dc54a9bd0691fd02f3a1d6655a0a8)
- Fix MySQL 8 upgrade-script compatibility and remove old vectors by docId before reparsing. [9a2f326e](https://github.com/ageerle/ruoyi-ai/commit/9a2f326e42c07614f0898a1ff279176069a768f1)
- Merge the shared tracing module and RAG chat instrumentation. The feature branch had June commits, but landed on main in July. [11bb1dba](https://github.com/ageerle/ruoyi-ai/commit/11bb1dba0f846cc2173abd054d98d2b6937c32cd)
- Isolate SSE by session, correct tracing tenant handling and remove redundant code. [afaa86ef](https://github.com/ageerle/ruoyi-ai/commit/afaa86ef6ed5134aa852f11c7712d5a985c16fe2)
- Connect streaming thinking events and add a table allowlist check to SqlAgent. [a69d1f51](https://github.com/ageerle/ruoyi-ai/commit/a69d1f51b9f5061f740367188735c27cb6cff090)
- Add ChitChatAgent as a conversational fallback under the Supervisor. [24bee53f](https://github.com/ageerle/ruoyi-ai/commit/24bee53f9edaeda28988a6facad3c49af60f496d)
- Add short-drama and media-generation capabilities and sanitize sensitive example values in SQL scripts. [2ae13aaf](https://github.com/ageerle/ruoyi-ai/commit/2ae13aafd423a9aabd01b284c4169604bf8e4b07)
- Extend short-drama audio and coding modules, MCP file tools and WebSocket support. [fece90b3](https://github.com/ageerle/ruoyi-ai/commit/fece90b3075e7c16de041d0e797d538925ca6f6f)
- Remove FastJson 1.2.83 and replace the affected JSON handling with Jackson. [83fd1ee9](https://github.com/ageerle/ruoyi-ai/commit/83fd1ee98329c4ba65756e2ef30ae02a638f0101)
- Assign a default role and missing menu permissions after registration, and add a first-token timeout for short-drama streaming. [7640de34](https://github.com/ageerle/ruoyi-ai/commit/7640de34e5f9c5945b7c7452ece9e47e89f7c9c7)

---

[Newer：2026-08](./202608_changeLog.md) · [All changelogs](./index.md) · [Older：2026-06](./202606_changeLog.md)
