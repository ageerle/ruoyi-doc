---
outline: [2, 3]
prev: false
next: false
---

# 2026-09 ruoyi-ai 更新日志

Qdrant 删除容错、线程池启动修复与 Windows 部署。

根据本月 **3 条主分支提交及合入记录**整理，核对时间为 **2026-09-08**。统计方法见[日志口径与归档](./index.md#scope)。

## 主要更新

- 修复 Qdrant 删除容错：集合不存在时按已删除处理，覆盖知识库、文档和片段清理；连接与权限错误仍会报错。 [b27fa844](https://github.com/ageerle/ruoyi-ai/commit/b27fa844e65b1701d5e0b8579fab682e742c492a)
- 修复高核 CPU 服务器启动失败：mainExecutor 的核心线程数限制为不超过最大线程数 100。该修复通过 PR #328 于 9 月合入。 [ee838aa4](https://github.com/ageerle/ruoyi-ai/commit/ee838aa4884c34c07f33dbe2a2f10bb5b65acb6a)
- 补充 Windows Docker 部署步骤：说明 Docker Desktop、Compose V2、PowerShell 环境文件复制、镜像拉取和服务状态检查。 [d4ed2b86](https://github.com/ageerle/ruoyi-ai/commit/d4ed2b867274d3f2ac08efd6041b24fd4b30af64)

---

[全部更新日志](./index.md) · [较早一期：2026-08](./202608_changeLog.md)
