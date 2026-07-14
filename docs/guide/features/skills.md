---
outline: deep
---

# 技能管理

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) 的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 概览

技能是面向复杂任务的可复用能力包。与工具偏向单次函数调用不同，技能通常包含说明文档、脚本、模板和参考资料，适合处理 Office 文档、PDF、数据表格等多步骤任务。

RuoYi AI 当前在 `ruoyi-admin/src/main/resources/skills` 下内置：

| 技能 | 说明 |
| --- | --- |
| `docx` | Word 文档创建、编辑和分析。 |
| `pdf` | PDF 文档处理、文本/表格/表单提取。 |
| `xlsx` | Excel 电子表格创建、编辑和计算。 |

`SkillsAgent` 会根据用户问题调用 `activate_skill("skill-name")` 激活对应技能，再按照 `SKILL.md` 中的指令执行。

## 技能目录结构

```text
skills/
  docx/
    SKILL.md
    scripts/
    templates/
  pdf/
    SKILL.md
    reference.md
    forms.md
    scripts/
  xlsx/
    SKILL.md
    recalc.py
```

## 调用流程

```text
用户请求
  -> SkillsAgent 判断技能
  -> activate_skill
  -> 读取 SKILL.md
  -> 调用脚本/模板/资源
  -> 返回文档或分析结果
```

## 编写技能

一个技能至少需要包含 `SKILL.md`，建议包含以下内容：

| 小节 | 说明 |
| --- | --- |
| 适用场景 | 说明什么时候应该使用该技能。 |
| 输入要求 | 说明需要哪些文件、参数或上下文。 |
| 操作步骤 | 用明确步骤约束执行流程。 |
| 输出规范 | 说明产物格式、文件命名和校验方式。 |
| 限制条件 | 列出不支持的文件格式或风险。 |

截图占位：技能列表页，建议放置在 `/images/skills/skill-list.webp`。

## 后台管理占位

预留技能管理页面可包含：

| 功能 | 说明 |
| --- | --- |
| 技能列表 | 展示技能名称、版本、状态、说明。 |
| 技能详情 | 展示 `SKILL.md`、资源文件、脚本清单。 |
| 启停控制 | 控制技能是否可被智能体调用。 |
| 权限控制 | 限制哪些角色、租户或用户可调用技能。 |
| 执行日志 | 记录激活技能、调用脚本、生成文件的过程。 |

## 扩展建议

1. 技能脚本应放在技能目录内部，避免依赖不可控的全局路径。
2. 对生成文件做格式校验，例如 Excel 重新计算、PDF 页面检查。
3. 技能执行产物应与用户会话关联，便于下载和审计。
4. 高风险技能需要权限控制，例如文件编辑、外部命令、网络访问。
