---
outline: [2, 3]
prev: false
next: false
---

# 2026-08 ruoyi-ai 更新日志

v3.1.0 准备、Coding Harness 与 CMS。

根据本月 **13 条主分支提交及合入记录**整理，核对时间为 **2026-09-08**。统计方法见[日志口径与归档](./index.md#scope)。

## 主要更新

- 准备 v3.1.0 版本，更新发布相关配置。 [e34592c3](https://github.com/ageerle/ruoyi-ai/commit/e34592c3d4eaac4d11475de892e5c686a3436b9e)
- 新增 Coding Harness 运行时与 CMS 内容管理模块，编程运行时包含计划、工具调用、审批、持久化状态和恢复等代码。 [25ab33c7](https://github.com/ageerle/ruoyi-ai/commit/25ab33c79c80b18aafaae0e814a640067e270593)
- 向 LangChain4j 智能体暴露内置工具，补齐智能体工具装配。 [997548dd](https://github.com/ageerle/ruoyi-ai/commit/997548dd4b5a569a7e404a7835696130a2dd6b87)
- 修复编辑智能体时关联工具加载失败的问题。 [6c383dd9](https://github.com/ageerle/ruoyi-ai/commit/6c383dd9f5ae63aaef3948602cab23217ec5cb1f)
- 将 RAG 追踪类移动到 argtrace 包，并同步数据库结构。 [9d439d1d](https://github.com/ageerle/ruoyi-ai/commit/9d439d1dcf1bc5ce8e370646d125d23ffe9cd15e)
- 新增预构建镜像部署说明，便于按版本拉取镜像启动服务。 [038e7725](https://github.com/ageerle/ruoyi-ai/commit/038e7725f9be24c1e99ee53018223a0a6e5b3356)
- 调整镜像构建流程，允许执行前端依赖的构建步骤。 [9ae49f87](https://github.com/ageerle/ruoyi-ai/commit/9ae49f8797d534eb304db66feabd913fdbc5a756)
- 启用演示模式默认配置，部署时需核对自己的运行模式。 [f92e5106](https://github.com/ageerle/ruoyi-ai/commit/f92e5106658f4c97e423e28cf703c93c61a8bb22)

---

[较新一期：2026-09](./202609_changeLog.md) · [全部更新日志](./index.md) · [较早一期：2026-07](./202607_changeLog.md)
