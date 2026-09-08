---
outline: [2, 3]
prev: false
next: false
---

# 2026-09 ruoyi-ai Changelog

Qdrant deletion, executor startup fixes and Windows deployment.

Based on **3 main-branch commits and merges** in this month, verified on **2026-09-08**. See the [scope and archive](./index.md#scope).

## Key changes

- Treat missing Qdrant collections as already deleted when cleaning up knowledge bases, documents or fragments; connection and permission errors still propagate. [b27fa844](https://github.com/ageerle/ruoyi-ai/commit/b27fa844e65b1701d5e0b8579fab682e742c492a)
- Cap mainExecutor core threads at its maximum of 100 to prevent startup failures on high-core-count servers. PR #328 landed in September. [ee838aa4](https://github.com/ageerle/ruoyi-ai/commit/ee838aa4884c34c07f33dbe2a2f10bb5b65acb6a)
- Add Windows Docker instructions covering Docker Desktop, Compose V2, PowerShell environment-file setup, image pulls and service checks. [d4ed2b86](https://github.com/ageerle/ruoyi-ai/commit/d4ed2b867274d3f2ac08efd6041b24fd4b30af64)

---

[All changelogs](./index.md) · [Older：2026-08](./202608_changeLog.md)
