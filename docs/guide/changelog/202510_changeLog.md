---
outline: [2, 3]
prev: false
next: false
---

# 2025-10 ruoyi-ai 更新日志

工作流、MCP 进程管理与向量库扩展。

根据本月 **27 条主分支提交及合入记录**整理，核对时间为 **2026-09-08**。统计方法见[日志口径与归档](./index.md#scope)。

## 主要更新

- 合入工作流功能开发，并继续补充工作流样式接口与数据库脚本。 [beaf384f](https://github.com/ageerle/ruoyi-ai/commit/beaf384f79748b907a34ed03e71044e63d4e13ef)
- 新增工作流样式接口并更新 SQL。 [3164eb0b](https://github.com/ageerle/ruoyi-ai/commit/3164eb0bc9e3ca9f8a9610f1a4485ddc9d9b3c59)
- 修复工作流运行相关问题。 [65d59f4a](https://github.com/ageerle/ruoyi-ai/commit/65d59f4acf722dfe97ed25fee32f22daec51a5d0)
- 增加 MCP 进程管理与 mcp_info 增删改查。 [dbdacdad](https://github.com/ageerle/ruoyi-ai/commit/dbdacdad5c00c00b56bc8426a5d1bd9ce5c6e040)
- 使用策略与工厂模式动态加载 Embedding 模型，扩展多供应商接入。 [5088c0e6](https://github.com/ageerle/ruoyi-ai/commit/5088c0e6d7ce2ee908b3daad024980effcda9b6a)
- 完善 Milvus 向量存储策略实现。 [34a71cfc](https://github.com/ageerle/ruoyi-ai/commit/34a71cfc55a9c570dea15066fc95807550af847b)
- 完善 Weaviate 向量库配置说明，并调整开发环境数据库连接配置。 [ac570fd4](https://github.com/ageerle/ruoyi-ai/commit/ac570fd45c7b38e221f37713e85c4b4fba2bc4ef)
- 合入数字人后端模块。 [08d49772](https://github.com/ageerle/ruoyi-ai/commit/08d497726337acbffedb9d67860939f344f08062)
- 更新 ChatRequest 与 DeepSeek 聊天实现，完善 DeepSeek 接入。 [ce52402e](https://github.com/ageerle/ruoyi-ai/commit/ce52402e4c491fd9697832524e6ecc621078fa25)
- 解决依赖冲突导致的方法不存在问题。 [63f6df8a](https://github.com/ageerle/ruoyi-ai/commit/63f6df8af0469e1123655f6994585786bc3f99ca)

---

[较新一期：2025-11](./202511_changeLog.md) · [全部更新日志](./index.md) · [较早一期：2025-09](./202509_changeLog.md)
