---
outline: [2, 3]
---

# Changelog archive

The sidebar displays the latest **5 monthly entries**. Earlier entries remain available here, and the top navigation opens the newest entry.

## Reporting scope {#scope}

Changes from September 2025 onward were checked against the public [ruoyi-ai main snapshot](https://github.com/ageerle/ruoyi-ai/commit/d4ed2b867274d3f2ac08efd6041b24fd4b30af64) on **2026-09-08**. Only published GitHub commits are included.

Months follow the main branch's first-parent history and committer time in UTC+8. Merge commits are counted once and assigned to the month they land on main; earlier dates on feature branches do not move a feature into an earlier month. Counts cover all main-branch entries, while summaries select changes relevant to developers.

These monthly summaries are not release announcements. Historical features may have changed in later refactors; consult the current feature documentation for usage. The four entries from May through August 2025 are preserved as legacy documentation and were not recalculated.

## All months

| Month | Main entries | Highlights |
| --- | ---: | --- |
| [2026-09](./202609_changeLog.md) | 3 | Qdrant deletion, executor startup fixes and Windows deployment |
| [2026-08](./202608_changeLog.md) | 13 | v3.1.0 preparation, Coding Harness and CMS |
| [2026-07](./202607_changeLog.md) | 24 | Workflow routing, unified RAG, media and tracing |
| [2026-06](./202606_changeLog.md) | 6 | README and project resource maintenance |
| [2026-05](./202605_changeLog.md) | 2 | Atlas Cloud integration and knowledge configuration |
| [2026-04](./202604_changeLog.md) | 14 | Version 3.0, document skills, providers and retrieval |
| [2026-03](./202603_changeLog.md) | 12 | v3.0.0 branch merge, chat refactoring and Qdrant |
| [2026-02](./202602_changeLog.md) | 1 | Workflow backend, human feedback and file uploads |
| [2026-01](./202601_changeLog.md) | 0 | No new main-branch landings |
| [2025-12](./202512_changeLog.md) | 6 | RAGFlow, MCP tools and workflow nodes |
| [2025-11](./202511_changeLog.md) | 9 | Keyword nodes, digital humans and graph configuration |
| [2025-10](./202510_changeLog.md) | 27 | Workflows, MCP process management and vector stores |
| [2025-09](./202509_changeLog.md) | 23 | Knowledge parsing, WeChat, models and storage fixes |
| [2025-08](./202508_changeLog.md) | — | Legacy changelog |
| [2025-07](./202507_changeLog.md) | — | Legacy changelog |
| [2025-06](./202506_changeLog.md) | — | Legacy changelog |
| [2025-05](./202505_changeLog.md) | — | Legacy changelog |

## Maintaining these pages

When adding a month, create its Chinese and English pages, add it at the start of changelogMonths in docs/.vitepress/config.mts, and add an archive row. The top navigation and five-entry sidebar use that list.
