---
outline: [2, 3]
prev: false
next: false
---

# 2026-03 ruoyi-ai Changelog

v3.0.0 branch merge, chat refactoring and Qdrant.

Based on **12 main-branch commits and merges** in this month, verified on **2026-09-08**. See the [scope and archive](./index.md#scope).

## Key changes

- Merge the v3.0.0 development branch into main, refactor chat services and modules, and update v3 SQL scripts. Further version 3.0 changes follow in April. [0687b495](https://github.com/ageerle/ruoyi-ai/commit/0687b49542d4cb2e79e5c8dfef58886872cedd19)
- Restore MCP and dynamic-agent modules and organize Docker files, port mappings and environment variables through the v3.0.0 branch merge. [0687b495](https://github.com/ageerle/ruoyi-ai/commit/0687b49542d4cb2e79e5c8dfef58886872cedd19)
- Remove the old ruoyi-modules-api module; use the new module layout when locating extension points. [f95cb179](https://github.com/ageerle/ruoyi-ai/commit/f95cb179333ccb27dac4a2ff35425a6f1ae5ec3a)
- Add Qdrant vector-search support. [75b21d36](https://github.com/ageerle/ruoyi-ai/commit/75b21d36336d29d12000f0effed4a268498c19aa)
- Document Qdrant deployment with Docker Compose. [3071bfd0](https://github.com/ageerle/ruoyi-ai/commit/3071bfd0f95fb7d7779d5b29e8a0f4b078ec4502)
- Fix file-type matching and knowledge-base splitting configuration. [11696a01](https://github.com/ageerle/ruoyi-ai/commit/11696a016d29312e0e44819a693875154b8eb33e)
- Add an issue template for enterprise AI application collaboration. [02240f3f](https://github.com/ageerle/ruoyi-ai/commit/02240f3fd0040553f318fd87f6da33dde6468611)

---

[Newer：2026-04](./202604_changeLog.md) · [All changelogs](./index.md) · [Older：2026-02](./202602_changeLog.md)
