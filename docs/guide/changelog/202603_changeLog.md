---
outline: [2, 3]
prev: false
next: false
---

# 2026-03 ruoyi-ai 更新日志

v3.0.0 分支合入、聊天重构与 Qdrant。

根据本月 **12 条主分支提交及合入记录**整理，核对时间为 **2026-09-08**。统计方法见[日志口径与归档](./index.md#scope)。

## 主要更新

- 将 v3.0.0 开发分支合入 main，重构聊天服务和模块结构，并更新 v3 数据库脚本。此处记录分支合入，4 月还有后续 3.0 版本提交。 [0687b495](https://github.com/ageerle/ruoyi-ai/commit/0687b49542d4cb2e79e5c8dfef58886872cedd19)
- 随 v3.0.0 分支恢复 MCP 与动态 Agent 相关模块，整理 Docker 部署文件、端口映射与环境变量配置。 [0687b495](https://github.com/ageerle/ruoyi-ai/commit/0687b49542d4cb2e79e5c8dfef58886872cedd19)
- 删除旧 ruoyi-modules-api 模块；二次开发时需按新模块结构定位代码。 [f95cb179](https://github.com/ageerle/ruoyi-ai/commit/f95cb179333ccb27dac4a2ff35425a6f1ae5ec3a)
- 新增 Qdrant 向量检索支持。 [75b21d36](https://github.com/ageerle/ruoyi-ai/commit/75b21d36336d29d12000f0effed4a268498c19aa)
- 补充 Qdrant Docker Compose 部署说明。 [3071bfd0](https://github.com/ageerle/ruoyi-ai/commit/3071bfd0f95fb7d7779d5b29e8a0f4b078ec4502)
- 修复文件类型匹配及知识库切割配置问题。 [11696a01](https://github.com/ageerle/ruoyi-ai/commit/11696a016d29312e0e44819a693875154b8eb33e)
- 新增企业 AI 应用合作登记 Issue 模板。 [02240f3f](https://github.com/ageerle/ruoyi-ai/commit/02240f3fd0040553f318fd87f6da33dde6468611)

---

[较新一期：2026-04](./202604_changeLog.md) · [全部更新日志](./index.md) · [较早一期：2026-02](./202602_changeLog.md)
