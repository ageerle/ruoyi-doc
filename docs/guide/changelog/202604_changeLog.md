---
outline: [2, 3]
prev: false
next: false
---

# 2026-04 ruoyi-ai 更新日志

3.0 版本、文档技能、多厂商与检索增强。

根据本月 **14 条主分支提交及合入记录**整理，核对时间为 **2026-09-08**。统计方法见[日志口径与归档](./index.md#scope)。

## 主要更新

- 更新 3.0 版本代码，升级 LangChain4j 至 1.13.0，加入 docx、pdf、xlsx 技能资源和演示模式拦截。 [c1fc0289](https://github.com/ageerle/ruoyi-ai/commit/c1fc02894b1dc6f4689028128df0cc36b0b804d1)
- 合入知识库检索测试、混合检索、文档异步解析与用户端知识库对话相关改进。 [9a7b7274](https://github.com/ageerle/ruoyi-ai/commit/9a7b727413177383274ff2c440a0cba767ceb866)
- 增加重排序功能及千问重排模型相关 SQL。 [07bdc5e5](https://github.com/ageerle/ruoyi-ai/commit/07bdc5e585111181fa527e901741686e8ac2f7e1)
- 新增智谱向量模型实现。 [74eb5b25](https://github.com/ageerle/ruoyi-ai/commit/74eb5b2530ef7741ec8f054a9fb0dd237bb10c2d)
- 增加小米 MiMo、DeepSeek 与自定义厂商等 Provider 支持。 [4f79a665](https://github.com/ageerle/ruoyi-ai/commit/4f79a66559e59e445ba7465d8c4675acb5211bcc)
- 接入 MiniMax 模型提供商，并补充监听逻辑。 [081da6d1](https://github.com/ageerle/ruoyi-ai/commit/081da6d18da4df098736bb21fca44a2f1c8760b6)
- 修正上下文消息构建顺序，确保历史与当前问题按正确顺序进入模型。 [bf7b5eac](https://github.com/ageerle/ruoyi-ai/commit/bf7b5eac721edb9a091017d5167afbc4b2245227)
- 修复 docker-compose-all.yaml 的运行问题。 [c4f7c1f5](https://github.com/ageerle/ruoyi-ai/commit/c4f7c1f5d0e9898e9ff00d3c195d2cd80dd2d466)

---

[较新一期：2026-05](./202605_changeLog.md) · [全部更新日志](./index.md) · [较早一期：2026-03](./202603_changeLog.md)
