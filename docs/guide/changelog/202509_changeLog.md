---
outline: [2, 3]
prev: false
next: false
---

# 2025-09 ruoyi-ai 更新日志

知识库解析、微信、模型与存储修复。

根据本月 **23 条主分支提交及合入记录**整理，核对时间为 **2026-09-08**。统计方法见[日志口径与归档](./index.md#scope)。

## 主要更新

- 合入 MinerU 文档处理分支，补充文档解析相关实现。 [fa5dc80a](https://github.com/ageerle/ruoyi-ai/commit/fa5dc80a934e9d8bb9bc6ae3a10e51f1e15bad7d)
- 合入 PDF 图片处理分支，扩展知识库文档中的图片处理。 [acc2d5d1](https://github.com/ageerle/ruoyi-ai/commit/acc2d5d1a89bbe1b1e58f79120ee4a4b09211cd0)
- 恢复微信模块并优化知识库切片。 [6462752f](https://github.com/ageerle/ruoyi-ai/commit/6462752fd63b3d8bb28139ea9756e1d473e74f30)
- 合入 Spring AI 1.0.0 升级相关改动。 [25e659df](https://github.com/ageerle/ruoyi-ai/commit/25e659dffa1053aa4c2dbea567ff2407f19fef64)
- 补充接口文档测试能力。 [54e7999f](https://github.com/ageerle/ruoyi-ai/commit/54e7999fe3eb994f444cd9eb53f5ec63a164c056)
- 修复管理端知识库删除失败。 [f9066457](https://github.com/ageerle/ruoyi-ai/commit/f906645708e2bb9d97423d76469d034754fa0cc8)
- 修复问答页面文件上传与存储桶处理问题。 [837236f1](https://github.com/ageerle/ruoyi-ai/commit/837236f1cc33aba084eb5e2f42c120b60b89bd3e)
- 修正问答服务重新查询模型时覆盖自动选中模型的问题。 [c17e16dd](https://github.com/ageerle/ruoyi-ai/commit/c17e16dd0fc89767e8c65323af84866bd8be2ff9)
- 移除固定 limit 1 写法，提高不同数据库的兼容性。 [60793b95](https://github.com/ageerle/ruoyi-ai/commit/60793b957a09e3a65bfdf87d736beb35317b2f34)
- 补充 session 表会话 ID 相关 SQL。 [13da60e1](https://github.com/ageerle/ruoyi-ai/commit/13da60e151fca508b364ea3fe4f35568a7f0b40c)

---

[较新一期：2025-10](./202510_changeLog.md) · [全部更新日志](./index.md) · [较早一期：2025-08](./202508_changeLog.md)
