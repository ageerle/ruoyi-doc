---
outline: [2, 3]
prev: false
next: false
---

# 2026-07 ruoyi-ai 更新日志

工作流与聊天路由、RAG 统一检索、媒体与追踪。

根据本月 **24 条主分支提交及合入记录**整理，核对时间为 **2026-09-08**。统计方法见[日志口径与归档](./index.md#scope)。

## 主要更新

- 梳理普通模型、智能体和工作流的聊天执行路径，接入智谱网页搜索，并清理旧工作流节点及恢复处理逻辑。 [6e264ad5](https://github.com/ageerle/ruoyi-ai/commit/6e264ad5003fd5781144fee789722fa63bedcbcb)
- 统一知识库切割配置、检索阈值、重排和缓存语义，完善按知识库路由向量库、文档重新解析与向量数据生命周期。 [46a8d6b5](https://github.com/ageerle/ruoyi-ai/commit/46a8d6b5526dc54a9bd0691fd02f3a1d6655a0a8)
- 修正 MySQL 8 升级脚本兼容性，重新解析文档时按 docId 清理旧向量。 [9a2f326e](https://github.com/ageerle/ruoyi-ai/commit/9a2f326e42c07614f0898a1ff279176069a768f1)
- 合入通用链路追踪模块及 RAG 对话埋点；功能分支虽在 6 月提交，按主分支合入时间记录在 7 月。 [11bb1dba](https://github.com/ageerle/ruoyi-ai/commit/11bb1dba0f846cc2173abd054d98d2b6937c32cd)
- 将 SSE 按会话隔离，修正追踪租户处理并清理冗余逻辑。 [afaa86ef](https://github.com/ageerle/ruoyi-ai/commit/afaa86ef6ed5134aa852f11c7712d5a985c16fe2)
- 接通 thinking 流式输出链路，并增加 SqlAgent 表白名单校验。 [a69d1f51](https://github.com/ageerle/ruoyi-ai/commit/a69d1f51b9f5061f740367188735c27cb6cff090)
- 新增 ChitChatAgent，作为 Supervisor 的闲聊兜底子 Agent。 [24bee53f](https://github.com/ageerle/ruoyi-ai/commit/24bee53f9edaeda28988a6facad3c49af60f496d)
- 新增短剧与媒体生成能力，同时清理数据库脚本中的敏感示例值。 [2ae13aaf](https://github.com/ageerle/ruoyi-ai/commit/2ae13aafd423a9aabd01b284c4169604bf8e4b07)
- 继续补充短剧音频、编码模块、MCP 文件工具及 WebSocket 支持。 [fece90b3](https://github.com/ageerle/ruoyi-ai/commit/fece90b3075e7c16de041d0e797d538925ca6f6f)
- 移除 FastJson 1.2.83，相关 JSON 处理替换为 Jackson。 [83fd1ee9](https://github.com/ageerle/ruoyi-ai/commit/83fd1ee98329c4ba65756e2ef30ae02a638f0101)
- 新用户注册后绑定默认角色并补齐菜单权限；短剧流式生成增加首 Token 超时处理。 [7640de34](https://github.com/ageerle/ruoyi-ai/commit/7640de34e5f9c5945b7c7452ece9e47e89f7c9c7)

---

[较新一期：2026-08](./202608_changeLog.md) · [全部更新日志](./index.md) · [较早一期：2026-06](./202606_changeLog.md)
